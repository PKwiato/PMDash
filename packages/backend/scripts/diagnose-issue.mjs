import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY = process.argv[2] ?? 'STAT-160236';
const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../data/config.json'), 'utf8'));
const auth = Buffer.from(`${config.jira.email}:${config.jira.token}`).toString('base64');
const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };
const base = 'https://statscore.atlassian.net/rest/api/3';
const agile = 'https://statscore.atlassian.net/rest/agile/1.0';
const boardId = config.jira.defaultBoardId;

async function get(url) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

const allFields = await get(`${base}/field`);
const teamField = allFields.find(f => f.name?.trim().toLowerCase() === 'statscore team');
const fieldIds = ['summary', 'status', 'issuetype', 'parent', 'customfield_10014', 'project'];
if (teamField) fieldIds.push(teamField.id);

const issue = await get(`${base}/issue/${KEY}?fields=${fieldIds.join(',')}`);
const f = issue.fields;
console.log('===', KEY, '===');
console.log('summary:', f.summary);
console.log('type:', f.issuetype?.name);
console.log('project:', f.project?.key);
console.log('status:', f.status?.name);
console.log('parent:', f.parent?.key, f.parent?.fields?.issuetype?.name ?? '');
if (teamField) console.log('STATSCORE Team:', JSON.stringify(f[teamField.id]));

const board = await get(`${agile}/board/${boardId}`);
console.log('\n=== Board', boardId, '===');
console.log('name:', board.name);

const projs = await get(`${agile}/board/${boardId}/project?maxResults=50`);
const projKeys = projs.values.map(p => p.key);
console.log('board projects:', projKeys.join(', '));
console.log('issue in board projects:', projKeys.includes(f.project.key));

const types = await get(`${base}/issuetype/project?projectId=${f.project.id}`);
const thisType = types.find(t => t.name === f.issuetype.name);
console.log('\nhierarchyLevel:', thisType?.hierarchyLevel);
console.log('subtask:', thisType?.subtask);

const isProgramLike =
  thisType?.hierarchyLevel === 1 ||
  /\b(epic|program|programme|initiative|portfolio|theme|capability)\b/i.test(f.issuetype.name);
console.log('matchesProgramIssueType heuristic:', isProgramLike);

let epicOnBoard = false;
for (let start = 0; start < 500; start += 50) {
  const epics = await get(`${agile}/board/${boardId}/epic?startAt=${start}&maxResults=50`);
  if (epics.values?.some(e => e.key === KEY)) epicOnBoard = true;
  if (epics.isLast) break;
}
console.log('on board epic panel:', epicOnBoard);

const children = await get(
  `${base}/search/jql?jql=${encodeURIComponent(`"Epic Link" = ${KEY} OR parent = ${KEY}`)}&maxResults=10&fields=key`,
);
console.log('linked children:', children.issues?.map(i => i.key).join(', ') || '(none)');

let refs = 0;
let scanned = 0;
let nextPageToken;
for (let page = 0; page < 50; page++) {
  let url = `${agile}/board/${boardId}/issue?maxResults=100&fields=customfield_10014,parent`;
  if (nextPageToken) url += `&nextPageToken=${encodeURIComponent(nextPageToken)}`;
  const data = await get(url);
  for (const i of data.issues ?? []) {
    scanned++;
    const epic = i.fields.customfield_10014;
    const epicKey = typeof epic === 'string' ? epic : epic?.key;
    const parentKey = i.fields.parent?.key;
    if (epicKey === KEY || parentKey === KEY) refs++;
  }
  if (data.isLast || !data.nextPageToken) break;
  nextPageToken = data.nextPageToken;
}
console.log(`board issues scanned: ${scanned}, referencing ${KEY}: ${refs}`);
