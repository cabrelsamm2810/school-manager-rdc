import { createCrudHandlers } from '@/lib/crud-factory';
import { crudModels } from '@/lib/crud-models';

const { GET, PUT, DELETE } = createCrudHandlers(crudModels['sous-divisions']);
export { GET, PUT, DELETE };
