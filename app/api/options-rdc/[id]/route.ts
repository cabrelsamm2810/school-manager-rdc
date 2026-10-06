import { createCrudHandlers } from '@/lib/crud-factory';
import { crudModels } from '@/lib/crud-models';

const { GET, PUT, DELETE } = createCrudHandlers(crudModels['options-rdc']);
export { GET, PUT, DELETE };
