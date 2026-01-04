import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  // RF-M1: Registrar nuevo diagnóstico / tratamiento
  async create(dto: CreateMedicalRecordDto) {
    // Regla b: fecha no futura
    const recordDate = new Date(dto.date);
    const today = new Date();

    if (recordDate > today) {
      throw new BadRequestException(
        'La fecha del historial médico no puede ser futura',
      );
    }

    // RF-M2: Validar existencia del paciente (via NATS)
    const patientExists = await firstValueFrom(
      this.natsClient.send('patients.findById', dto.patient_id),
    ).catch(() => null);

    if (!patientExists) {
      throw new NotFoundException('Paciente no existe');
    }

    // Crear historial (NO se puede modificar ni eliminar luego)
    return this.prisma.medicalRecord.create({
      data: {
        doctor_id: dto.doctor_id,
        patient_id: dto.patient_id,
        date: recordDate,
        diagnosis: dto.diagnosis,
        treatment: dto.treatment,
      },
    });
  }

  // RF-M3: Consultar historial clínico completo de un paciente
  async findByPatient(patientId: string) {
    const records = await this.prisma.medicalRecord.findMany({
      where: { patient_id: patientId },
      orderBy: { date: 'desc' },
    });

    if (records.length === 0) {
      throw new NotFoundException(
        'No existen historiales médicos para este paciente',
      );
    }

    return records;
  }
}