import * as fs from 'fs/promises';
import {getPageList} from './getPageList';
import type {ListPageMetaDataProps} from './listPageMetaData';
import {pageListToTsModule} from './pageListToTsModule';

export interface GeneratePageListProps extends ListPageMetaDataProps {
    dest: string,
}

export const generatePageList = async (props: GeneratePageListProps) => {
    const list = await getPageList(props);
    const code = pageListToTsModule(list);
    await fs.writeFile(props.dest, code);
};
