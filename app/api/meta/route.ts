import { NextResponse } from 'next/server';
import {
  defaultInstitutionTypes,
  defaultProvinces,
  defaultRoleOptions,
  registrationInstitutionTypes,
  ecErcRoleOptions,
  nonEcErcRoleOptions,
  allProvinces,
  educationProvincesByAdmin,
  provincialBureaux,
  fonctionsByRole,
  gradesByRole,
} from '@/lib/meta-data';

export async function GET() {
  return NextResponse.json({
    institutionTypes: defaultInstitutionTypes,
    roleOptions: defaultRoleOptions,
    provinces: defaultProvinces,
    registrationInstitutionTypes,
    ecErcRoleOptions,
    nonEcErcRoleOptions,
    allProvinces,
    educationProvincesByAdmin,
    provincialBureaux,
    fonctionsByRole,
    gradesByRole,
  });
}
