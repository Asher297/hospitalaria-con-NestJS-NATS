@Injectable()
export class PatientsService {
constructor(private prisma: PrismaService) {}


async create(dto: CreatePatientDto) {
return this.prisma.patient.create({ data: dto });
}


async findById(id: string) {
return this.prisma.patient.findUnique({ where: { id } });
}
}