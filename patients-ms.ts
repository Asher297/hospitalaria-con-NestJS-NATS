import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  // RF-P1: Registrar paciente (DNI único y válido)
  async create(dto: CreatePatientDto) {
    // Validar DNI (solo números y 8 dígitos como ejemplo)
    if (!/^[0-9]{8}$/.test(dto.dni)) {
      throw new BadRequestException('DNI inválido');
    }

    // Validar DNI único
    const existingPatient = await this.prisma.patient.findUnique({
      where: { dni: dto.dni },
    });

    if (existingPatient) {
      throw new BadRequestException('El DNI ya está registrado');
    }

    return this.prisma.patient.create({
      data: {
        dni: dto.dni,
        full_name: dto.full_name,
        sex: dto.sex,
        email: dto.email,
      },
    });
  }

  // RF-P2: Consultar paciente por ID
  async findById(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  // RF-P3: Listar pacientes
  async findAll() {
    return this.prisma.patient.findMany({
      where: { active: true },
    });
  }

  // RF-P4: Actualizar datos del paciente
  async update(id: string, dto: UpdatePatientDto) {
    await this.findById(id); // valida existencia

    return this.prisma.patient.update({
      where: { id },
      data: dto,
    });
  }

  // RF-P5: Desactivar paciente (soft delete)
  async deactivate(id: string) {
    await this.findById(id); // valida existencia

    return this.prisma.patient.update({
      where: { id },
      data: { active: false },
    });
  }
}
