import { createCrudHandlers } from '@/lib/crud-factory';
import { crudModels } from '@/lib/crud-models';

const { GET, POST, PATCH, BATCH_DELETE } = createCrudHandlers(crudModels.enseignants);
export { GET, POST, PATCH, BATCH_DELETE as DELETE };
