import { createFraisConfigHandlers } from '@/lib/frais-config-api';

const { PUT, DELETE } = createFraisConfigHandlers('fraisCategorie');
export { PUT, DELETE };
