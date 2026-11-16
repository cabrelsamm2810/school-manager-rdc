import { createFraisConfigHandlers } from '@/lib/frais-config-api';

const { GET, POST } = createFraisConfigHandlers('fraisCategorie');
export { GET, POST };
