import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntakeForm } from './intake-form.entity';
import { CreateIntakeFormDto, UpdateIntakeFormDto } from './dto/intake-form.dto';

@Injectable()
export class IntakeFormService {
  constructor(
    @InjectRepository(IntakeForm)
    private intakeFormRepo: Repository<IntakeForm>,
  ) {}

  async create(dto: CreateIntakeFormDto): Promise<IntakeForm> {
    const intakeForm = this.intakeFormRepo.create({
      work_order_id: dto.work_order_id,
      client_name: dto.client_name,
      client_phone: dto.client_phone,
      vehicle_plate: dto.vehicle_plate,
      vehicle_model: dto.vehicle_model,
      mileage_in: dto.mileage_in,
      vehicle_condition: dto.vehicle_condition,
      problem_description: dto.problem_description,
      client_signature: dto.client_signature,
      signed: dto.signed || false,
      ...(dto.signed && { signed_at: new Date() }),
    });

    return this.intakeFormRepo.save(intakeForm);
  }

  async findByWorkOrderId(workOrderId: string): Promise<IntakeForm | null> {
    const intakeForm = await this.intakeFormRepo.findOne({
      where: { work_order_id: workOrderId },
    });

    return intakeForm || null;
  }

  async update(id: string, dto: UpdateIntakeFormDto): Promise<IntakeForm> {
    const intakeForm = await this.intakeFormRepo.findOne({ where: { id } });

    if (!intakeForm) {
      throw new NotFoundException(`Intake form ${id} not found`);
    }

    Object.assign(intakeForm, dto);

    if (dto.signed && !intakeForm.signed) {
      intakeForm.signed_at = new Date();
    }

    return this.intakeFormRepo.save(intakeForm);
  }

  async delete(id: string): Promise<void> {
    const result = await this.intakeFormRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Intake form ${id} not found`);
    }
  }
}
