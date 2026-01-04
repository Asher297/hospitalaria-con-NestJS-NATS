import { IsString, IsEmail, IsOptional, Matches } from 'class-validator';

/**
 * DTO para crear paciente
 * RF-P1
 */
export class CreatePatientDto {
  @IsString()
  @Matches(/^[0-9]{8}$/, {
    message: 'El DNI debe contener exactamente 8 dígitos numéricos',
  })
  dni: string;

  @IsString()
  full_name: string;

  @IsString()
  sex: string;

  @IsEmail()
  email: string;
}

/**
 * DTO para actualizar paciente
 * RF-P4
 */
export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}