import { createFraisConfigHandlers } from '@/lib/frais-config-api';

const { GET, POST } = createFraisConfigHandlers('modePaiementFrais');
export { GET, POST };
