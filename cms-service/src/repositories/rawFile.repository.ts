import { BaseRepository } from './base.repository';
import RawFileModel, { IRawFile } from '../models/raw-files.model';

export class RawFileRepository extends BaseRepository<IRawFile> {
    constructor() {
        
        super(RawFileModel, 'cms_db');
    }
}
