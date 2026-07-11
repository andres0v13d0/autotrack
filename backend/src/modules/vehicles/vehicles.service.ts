import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly repo: Repository<Vehicle>,
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const existing = await this.repo.findOne({ where: { plate: dto.plate } });
    if (existing) throw new ConflictException('Plate already registered');
    const vehicle = this.repo.create(dto);
    return this.repo.save(vehicle);
  }

  findAll(): Promise<Vehicle[]> {
    return this.repo.find({ relations: { customer: true } });
  }

  findByCustomer(customer_id: string): Promise<Vehicle[]> {
    return this.repo.find({ where: { customer_id }, relations: { customer: true } });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.repo.findOne({
      where: { id },
      relations: { customer: true },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    if (dto.plate && dto.plate !== vehicle.plate) {
      const conflict = await this.repo.findOne({ where: { plate: dto.plate } });
      if (conflict) throw new ConflictException('Plate already registered');
    }
    Object.assign(vehicle, dto);
    return this.repo.save(vehicle);
  }

  async remove(id: string): Promise<{ message: string }> {
    const vehicle = await this.findOne(id);
    await this.repo.remove(vehicle);
    return { message: 'Vehicle deleted successfully' };
  }
}
