import { createCrudHandlers } from '@/lib/crud-factory';
import { crudModels } from '@/lib/crud-models';

const { PUT, DELETE } = createCrudHandlers(crudModels['coordination-nationale']);
export { PUT, DELETE };
