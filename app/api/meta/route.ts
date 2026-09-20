import { NextResponse } from 'next/server';
import {
  defaultInstitutionTypes,
  defaultProvinces,
  defaultRoleOptions
} from '@/lib/meta-data';

export async function GET() {
  return NextResponse.json({
    institutionTypes: defaultInstitutionTypes,
    roleOptions: defaultRoleOptions,
    provinces: defaultProvinces
  });
}
