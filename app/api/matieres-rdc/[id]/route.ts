import { createCrudHandlers } from '@/lib/crud-factory';
import { crudModels } from '@/lib/crud-models';

const { GET, PUT, DELETE } = createCrudHandlers(crudModels['matieres-rdc']);
export { GET, PUT, DELETE };
