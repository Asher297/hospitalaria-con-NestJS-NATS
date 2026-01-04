import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Controller()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  // RF-P1: Registrar paciente (DNI único)
  @MessagePattern('patients.create')
  async create(@Payload() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  // RF-P2: Consultar paciente por ID
  @MessagePattern('patients.findById')
  async findById(@Payload() id: string) {
    return this.patientsService.findById(id);
  }

  // RF-P3: Listar pacientes
  @MessagePattern('patients.findAll')
  async findAll() {
    return this.patientsService.findAll();
  }

  // RF-P4: Actualizar datos del paciente
  @MessagePattern('patients.update')
  async update(
    @Payload()
    payload: { id: string; data: UpdatePatientDto },
  ) {
    const { id, data } = payload;
    return this.patientsService.update(id, data);
  }

  // RF-P5: Desactivar paciente (soft delete)
  @MessagePattern('patients.deactivate')
  async deactivate(@Payload() id: string) {
    return this.patientsService.deactivate(id);
  }
}