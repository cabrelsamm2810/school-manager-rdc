import { createFraisConfigHandlers } from '@/lib/frais-config-api';

const { PUT, DELETE } = createFraisConfigHandlers('modePaiementFrais');
export { PUT, DELETE };
