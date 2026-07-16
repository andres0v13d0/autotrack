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

  findAll(): Promise<Customer[]> {
    return this.repo.find({ relations: { vehicles: true } });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.repo.findOne({
      where: { id },
      relations: { vehicles: true },
    });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { phone }, relations: { vehicles: true } });
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    if (dto.phone && dto.phone !== customer.phone) {
      const conflict = await this.repo.findOne({ where: { phone: dto.phone } });
      if (conflict) throw new ConflictException('Phone number already registered');
    }
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  async remove(id: string): Promise<{ message: string }> {
    const customer = await this.findOne(id);
    await this.repo.remove(customer);
    return { message: 'Customer deleted successfully' };
  }
}
