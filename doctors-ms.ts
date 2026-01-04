import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  // RF-D1: Registrar un doctor
  async create(dto: CreateDoctorDto) {
    // Validar DNI (8 dígitos numéricos como ejemplo)
    if (!/^[0-9]{8}$/.test(dto.dni)) {
      throw new BadRequestException('DNI inválido');
    }

    // Validar DNI único
    const existing = await this.prisma.doctor.findUnique({
      where: { dni: dto.dni },
    });

    if (existing) {
      throw new BadRequestException('El DNI ya está registrado');
    }

    return this.prisma.doctor.create({
      data: {
        dni: dto.dni,
        full_name: dto.full_name,
        specialty: dto.specialty,
        email: dto.email,
      },
    });
  }

  // RF-D2: Consultar doctor por ID
  async findById(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    return doctor;
  }

  // RF-D3: Listar doctores por especialidad
  async findBySpecialty(specialty: string) {
    const doctors = await this.prisma.doctor.findMany({
      where: {
        specialty,
        active: true,
      },
    });

    if (doctors.length === 0) {
      throw new NotFoundException(
        'No existen doctores activos para esta especialidad',
      );
    }

    return doctors;
  }

  // RF-D4: Actualizar información del doctor
  async update(id: string, dto: UpdateDoctorDto) {
    await this.findById(id); // valida existencia

    return this.prisma.doctor.update({
      where: { id },
      data: dto,
    });
  }

  // RF-D5: Desactivar doctor (soft delete)
  async deactivate(id: string) {
    await this.findById(id); // valida existencia

    return this.prisma.doctor.update({
      where: { id },
      data: { active: false },
    });
  }
}