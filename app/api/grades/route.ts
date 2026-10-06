import { createCrudHandlers } from '@/lib/crud-factory';
import { crudModels } from '@/lib/crud-models';

const { GET, POST } = createCrudHandlers(crudModels.grades);
export { GET, POST };
