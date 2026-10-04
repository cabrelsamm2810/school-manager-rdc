import { createCrudHandlers } from '@/lib/crud-factory';
import { crudModels } from '@/lib/crud-models';

const { GET, POST } = createCrudHandlers(crudModels['coordination-sous-provinciale']);
export { GET, POST };
