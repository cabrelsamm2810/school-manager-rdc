import { createCrudHandlers } from '@/lib/crud-factory';
import { crudModels } from '@/lib/crud-models';

const { GET, POST } = createCrudHandlers(crudModels['classes-rdc']);
export { GET, POST };
