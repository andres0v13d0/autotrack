import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto, userId: string): Promise<Customer> {
    const existing = await this.repo.findOne({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Phone number already registered');
    const customer = this.repo.create({ ...dto, created_by_id: userId });
    return this.repo.save(customer);
  }

  findAll(userId?: string): Promise<Customer[]> {
    if (!userId) {
      return this.repo.find({ relations: { vehicles: true } });
    }
    return this.repo.find({
      where: { created_by_id: userId },
      relations: { vehicles: true },
    });
  }

  async findOne(id: string, userId?: string): Promise<Customer> {
    const where: any = { id };
    if (userId) {
      where.created_by_id = userId;
    }
    const customer = await this.repo.findOne({
      where,
      relations: { vehicles: true },
    });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  async findByPhone(phone: string, userId?: string): Promise<Customer | null> {
    const where: any = { phone };
    if (userId) {
      where.created_by_id = userId;
    }
    return this.repo.findOne({ where, relations: { vehicles: true } });
  }

  async update(id: string, dto: UpdateCustomerDto, userId?: string): Promise<Customer> {
    const customer = await this.findOne(id, userId);
    if (dto.phone && dto.phone !== customer.phone) {
      const conflict = await this.repo.findOne({
        where: {
          phone: dto.phone,
          ...(userId && { created_by_id: userId }),
        },
      });
      if (conflict) throw new ConflictException('Phone number already registered');
    }
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  async remove(id: string, userId?: string): Promise<{ message: string }> {
    const customer = await this.findOne(id, userId);
    await this.repo.remove(customer);
    return { message: 'Customer deleted successfully' };
  }
}
