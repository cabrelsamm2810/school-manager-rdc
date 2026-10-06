import { createCrudHandlers } from '@/lib/crud-factory';
import { crudModels } from '@/lib/crud-models';

const { PUT, DELETE } = createCrudHandlers(crudModels.notes);
export { PUT, DELETE };
