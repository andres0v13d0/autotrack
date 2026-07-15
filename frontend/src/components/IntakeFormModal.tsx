import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Pen, Download } from 'lucide-react';
import Modal from './ui/Modal';
import Field, { inputCls } from './ui/Field';
import SignaturePad from './ui/SignaturePad';
import { intakeFormService } from '../services/intakeForm.service';
import { pdfService } from '../services/pdf.service';
import { generateAndDownloadIntakeFormPdf } from './IntakeFormPDF';
import type { WorkOrder } from '../types/workOrder';

const intakeFormSchema = z.object({
  client_name: z.string().min(2, 'Name required'),
  client_phone: z.string().min(10, 'Phone required'),
  mileage_in: z.number().int().min(0).optional(),
  vehicle_condition: z.string().optional(),
  problem_description: z.string().min(5, 'Description required'),
});

type IntakeFormValues = z.infer<typeof intakeFormSchema>;

interface IntakeFormModalProps {
  workOrder: WorkOrder;
  onClose: () => void;
}

export default function IntakeFormModal({ workOrder, onClose }: IntakeFormModalProps) {
  const qc = useQueryClient();
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      client_name: workOrder.vehicle?.customer?.name || '',
      client_phone: workOrder.vehicle?.customer?.phone || '',
      vehicle_condition: '',
      problem_description: workOrder.description_needed || '',
    },
  });

  const { data: existingForm, isLoading } = useQuery({
    queryKey: ['intake-form', workOrder.id],
    queryFn: () => intakeFormService.getByWorkOrder(workOrder.id),
    enabled: !!workOrder.id,
    throwOnError: false,
  });



  const createMutation = useMutation({
    mutationFn: async (values: IntakeFormValues) => {
      if (existingForm) {
        return intakeFormService.update(existingForm.id, {
          ...values,
          client_signature: signature || existingForm.client_signature,
          signed: !!signature || existingForm.signed,
        });
      } else {
        return intakeFormService.create(workOrder.id, {
          ...values,
          vehicle_plate: workOrder.vehicle?.plate || '',
          vehicle_model: workOrder.vehicle?.model || '',
          client_signature: signature,
          signed: !!signature,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['intake-form', workOrder.id] });
    },
  });

  useEffect(() => {
    if (existingForm) {
      reset({
        client_name: existingForm.client_name,
        client_phone: existingForm.client_phone,
        mileage_in: existingForm.mileage_in,
        vehicle_condition: existingForm.vehicle_condition,
        problem_description: existingForm.problem_description,
      });
      if (existingForm.client_signature) {
        setSignature(existingForm.client_signature);
      }
    }
  }, [existingForm, reset]);

  const handleDownloadPDF = async () => {
    if (!existingForm || !workOrder.id) return;
    try {
      setIsDownloading(true);
      // Fetch shop data using the pdf-data endpoint
      const { settings: shopData } = await pdfService.getPdfData(workOrder.id);
      await generateAndDownloadIntakeFormPdf(existingForm, shopData, workOrder);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <Modal title="Loading Intake Form..." onClose={onClose}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Vehicle Intake Form"
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-semibold"
          >
            Cancel
          </button>
          {existingForm && (
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-6 py-2.5 text-sm rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer transition-opacity inline-flex items-center gap-2"
              style={{ backgroundColor: '#10b981' }}
            >
              <Download size={16} />
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </button>
          )}
          <button
            type="submit"
            form="intake-form"
            disabled={createMutation.isPending}
            className="px-6 py-2.5 text-sm rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer transition-opacity inline-flex items-center gap-2"
            style={{ backgroundColor: '#f97316' }}
          >
            <FileText size={16} />
            {createMutation.isPending ? 'Saving...' : existingForm ? 'Update' : 'Create Form'}
          </button>
        </div>
      }
    >
      <form id="intake-form" onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-5">
        {/* Vehicle Info */}
        <div className="bg-gray-50 border-l-4 p-4 rounded-lg" style={{ borderLeftColor: '#f97316' }}>
          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Vehicle</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-semibold" style={{ color: '#0f1f3d' }}>
                {workOrder.vehicle?.plate}
              </p>
              <p className="text-gray-600">{workOrder.vehicle?.model}</p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase">Customer Information</p>
          <Field label="Customer Name" error={errors.client_name?.message}>
            <input
              {...register('client_name')}
              className={inputCls(!!errors.client_name)}
              placeholder="Full name"
            />
          </Field>
          <Field label="Phone" error={errors.client_phone?.message}>
            <input
              {...register('client_phone')}
              className={inputCls(!!errors.client_phone)}
              placeholder="Phone number"
            />
          </Field>
        </div>

        {/* Vehicle Condition */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase">Vehicle Condition</p>
          <Field label="Mileage In" error={errors.mileage_in?.message}>
            <input
              type="number"
              {...register('mileage_in', { valueAsNumber: true })}
              className={inputCls(!!errors.mileage_in)}
              placeholder="e.g. 45250"
            />
          </Field>
          <Field label="General Condition" error={errors.vehicle_condition?.message}>
            <textarea
              {...register('vehicle_condition')}
              rows={3}
              className={inputCls(!!errors.vehicle_condition)}
              placeholder="e.g. Scratches on left door, windows in good condition..."
            />
          </Field>
        </div>

        {/* Problem Description */}
        <Field label="Problem Description" error={errors.problem_description?.message}>
          <textarea
            {...register('problem_description')}
            rows={3}
            className={inputCls(!!errors.problem_description)}
            placeholder="Describe the problem reported by the customer"
          />
        </Field>

        {/* Signature */}
        <div className="border-2 border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase">Customer Signature</p>
          {signature ? (
            <div className="space-y-2">
              <img src={signature} alt="Signature" className="border border-gray-300 rounded h-24 w-full object-contain bg-gray-50" />
              <button
                type="button"
                onClick={() => setShowSignaturePad(true)}
                className="w-full px-3 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
                style={{ backgroundColor: '#f97316' }}
              >
                <Pen size={16} />
                Change Signature
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSignaturePad(true)}
              className="w-full px-4 py-3 text-sm rounded-lg text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2 border-2 border-dashed"
              style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}
            >
              <Pen size={16} />
              Capture Signature
            </button>
          )}
        </div>

        {/* Signature Pad Modal */}
        {showSignaturePad && (
          <Modal
            title="Digital Signature"
            onClose={() => setShowSignaturePad(false)}
            size="md"
          >
            <SignaturePad
              value={signature}
              onChange={setSignature}
              onClose={() => setShowSignaturePad(false)}
            />
          </Modal>
        )}
      </form>
    </Modal>
  );
}
