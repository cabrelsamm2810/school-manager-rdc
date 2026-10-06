import { createCrudHandlers } from '@/lib/crud-factory';
import { crudModels } from '@/lib/crud-models';

const { GET, POST } = createCrudHandlers(crudModels['ec-erc']);
export { GET, POST };
