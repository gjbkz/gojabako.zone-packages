import type {Commit} from './listCommits';
import {getAllCommits} from './listCommits';

export interface FileData {
    firstCommitAt: string,
    lastCommitAt: string,
    commitCount: number,
    filePath: string,
}

export const getFileData = async (
    /** A relative path to the repository root */
    filePath: string,
): Promise<FileData> => {
    const commitList = await getAllCommits(filePath);
    const now = new Date().toISOString();
    const firstCommit = commitList[commitList.length - 1] as Commit | null;
    const lastCommit = commitList[0] as Commit | null;
    return {
        firstCommitAt: firstCommit ? firstCommit.authorDate : now,
        lastCommitAt: lastCommit ? lastCommit.authorDate : now,
        commitCount: commitList.length,
        filePath,
    };
};
