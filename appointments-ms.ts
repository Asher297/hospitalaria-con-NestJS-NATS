import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,

    @Inject('NATS_SERVICE')
    private readonly natsClient: ClientProxy,
  ) {}

  // RF-A1: Crear cita médica
  async create(dto: CreateAppointmentDto) {
    // Regla d: fecha no pasada
    const appointmentDate = new Date(dto.date);
    const now = new Date();

    if (appointmentDate <= now) {
      throw new BadRequestException(
        'No se puede crear una cita con fecha pasada',
      );
    }

    // RF-A2: Validar existencia del paciente
    const patient = await firstValueFrom(
      this.natsClient.send('patients.findById', dto.patient_id),
    ).catch(() => null);

    if (!patient) {
      throw new NotFoundException('Paciente no existe');
    }

    // RF-A3: Validar doctor existente y activo
    const doctor = await firstValueFrom(
      this.natsClient.send('doctors.findById', dto.doctor_id),
    ).catch(() => null);

    if (!doctor) {
      throw new NotFoundException('Doctor no existe');
    }

    if (!doctor.active) {
      throw new BadRequestException('El doctor se encuentra inactivo');
    }

    // Regla e: no permitir citas duplicadas
    const duplicate = await this.appointmentModel.findOne({
      patient_id: dto.patient_id,
      doctor_id: dto.doctor_id,
      date: appointmentDate,
    });

    if (duplicate) {
      throw new BadRequestException('La cita médica ya existe');
    }

    // Regla c: estado inicial = agendada
    const appointment = new this.appointmentModel({
      patient_id: dto.patient_id,
      doctor_id: dto.doctor_id,
      date: appointmentDate,
      specialty: dto.specialty,
      status: 'agendada',
    });

    return appointment.save();
  }

  // RF-A4: Consultar citas por paciente
  async findByPatient(patientId: string) {
    const appointments = await this.appointmentModel.find({
      patient_id: patientId,
    });

    if (appointments.length === 0) {
      throw new NotFoundException(
        'No existen citas médicas para este paciente',
      );
    }

    return appointments;
  }

  // RF-A5: Consultar citas por fecha
  async findByDate(date: string) {
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const appointments = await this.appointmentModel.find({
      date: { $gte: start, $lte: end },
    });

    if (appointments.length === 0) {
      throw new NotFoundException(
        'No existen citas médicas para esta fecha',
      );
    }

    return appointments;
  }

  // RF-A6: Cancelar cita médica
  async cancel(id: string) {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Cita médica no encontrada');
    }

    appointment.status = 'cancelada';
    return appointment.save();
  }

  // RF-A7: Reprogramar cita médica
  async reschedule(id: string, newDate: string) {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Cita médica no encontrada');
    }

    const date = new Date(newDate);
    if (date <= new Date()) {
      throw new BadRequestException(
        'La nueva fecha debe ser futura',
      );
    }

    appointment.date = date;
    appointment.status = 'reprogramada';

    return appointment.save();
  }
}