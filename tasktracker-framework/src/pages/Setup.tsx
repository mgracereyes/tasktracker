// Setup (FR-005, FR-006, FR-016, FR-017, FR-029, FR-030): projects, tasks and items,
// new project from a template, Public/Private, Save as template, rename and archive.
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Project, Template } from '../api/types';
import { useMe } from '../auth/AuthContext';
import { Icon } from '../components/Icons';
import { Card, Empty, ErrorBox, Field, Loading, Modal, PageHead, Pill } from '../components/ui';
import { useAction, useLoad } from '../hooks';
import { Link, useRouter } from '../router';
import { useCatalog, type Catalog } from './shared';

/** A task in the new-project draft; `custom` = added by hand (not from the template or project). */
interface Draft {
  name: string;
  items: { name: string; on: boolean; custom?: boolean }[];
  on: boolean;
  custom?: boolean;
}

const fromTemplate = (t?: Template): Draft[] => (t ? t.tasks.map((x) => ({ name: x.name, on: true, items: x.items.map((i) => ({ name: i, on: true })) })) : []);

type Kind = 'project' | 'task' | 'item';

export function Setup() {
  const me = useMe();
  const cat = useCatalog();
  const tpl = useLoad(() => api.templates(), []);
  const act = useAction();
  const { query, navigate } = useRouter();
  const [rename, setRename] = useState<{ kind: Kind; id: number; name: string } | null>(null);
  const [search, setSearch] = useState('');
  const [show, setShow] = useState<'active' | 'archived'>('active');
  const [selected, setSelected] = useState(Number(query.get('project')) || 0);
  const [newTask, setNewTask] = useState('');
  const creating = query.get('new') === '1';

  // Opening /setup?project=<id> (e.g. right after creating one) selects that project.
  useEffect(() => {
    const id = Number(query.get('project'));
    if (id) { setSelected(id); setShow('active'); setSearch(''); }
  }, [query]);

  // Only the first load shows "Loading…"; reloads after a change keep the page on screen.
  if (!cat.data) return cat.error ? <ErrorBox msg={cat.error} /> : <Loading />;
  const c = cat.data;
  const reload = () => { cat.reload(); tpl.reload(); };

  if (creating) {
    return <NewProjectPage c={c} templates={tpl.data ?? []} onCancel={() => navigate('/setup')} onCreated={(p) => { reload(); navigate(`/setup?project=${p.id}`); }} />;
  }
  const pending = (tpl.data ?? []).filter((t) => t.approval === 'pending');

  const canEdit = (p: Project) => me.role === 'manager' || me.role === 'admin' || p.leadId === me.id;
  const ownerName = (p: Project) => p.leadName ?? c.users.find((u) => u.id === p.leadId)?.name ?? 'another team lead';
  const counts = (p: Project) => {
    const tasks = c.tasks.filter((t) => t.projectId === p.id && t.active);
    const items = c.items.filter((i) => i.active && tasks.some((t) => t.id === i.taskId));
    const people = c.members.filter((m) => m.projectId === p.id).length;
    return `${tasks.length} task${tasks.length === 1 ? '' : 's'} · ${items.length} item${items.length === 1 ? '' : 's'} · ${people} ${people === 1 ? 'person' : 'people'}`;
  };
  // Own projects first, then by name.
  const sorted = c.projects.slice().sort((a, b) => Number(canEdit(b)) - Number(canEdit(a)) || a.name.localeCompare(b.name));
  const active = sorted.filter((p) => p.active);
  const archived = sorted.filter((p) => !p.active);
  const listed = (show === 'active' ? active : archived).filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));
  const project = c.projects.find((p) => p.id === selected) ?? listed[0] ?? null;
  const editable = !!project && canEdit(project) && project.active;
  const run = (fn: () => Promise<unknown>) => act.run(fn, reload);

  const links = (kind: Kind, id: number, name: string, isActive: boolean) =>
    !editable ? null : isActive ? (
      <span className="optacts">
        <button className="link" onClick={() => setRename({ kind, id, name })}>Rename</button>
        <button className="link" onClick={() => run(() => api.archiveOption(kind, id))}>Archive</button>
      </span>
    ) : (
      <span className="optacts"><button className="link" onClick={() => run(() => api.restoreOption(kind, id))}>Restore</button></span>
    );

  return (
    <>
      <PageHead title="Setup" sub="Manage the projects, tasks and items people pick when they log time. Members are set per project in Assignments." actions={<button className="btn" onClick={() => navigate('/setup?new=1')}>New project</button>} />
      {me.role === 'manager' && pending.length > 0 && (
        <Card title="Templates waiting for approval">
          {pending.map((t) => (
            <div key={t.id} className="tr c3">
              <b>{t.name}</b><span className="mut">{t.category} · shared with everyone</span>
              <button className="btn sm" onClick={() => act.run(() => api.approveTemplate(t.id), reload)}>Approve</button>
            </div>
          ))}
        </Card>
      )}
      <div className="setupgrid">
        <Card>
          <input type="search" aria-label="Search projects" placeholder="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="row" role="tablist">
            <button role="tab" aria-selected={show === 'active'} className={`seg ${show === 'active' ? 'on' : ''}`} onClick={() => { setShow('active'); setSelected(0); }}>Active ({active.length})</button>
            <button role="tab" aria-selected={show === 'archived'} className={`seg ${show === 'archived' ? 'on' : ''}`} onClick={() => { setShow('archived'); setSelected(0); }}>Archived ({archived.length})</button>
          </div>
          {listed.length === 0 ? <Empty>{search ? 'No projects match your search.' : show === 'active' ? 'No projects yet.' : 'No archived projects.'}</Empty> : (
            <div className="projlist">
              {listed.map((p) => (
                <button key={p.id} className={`projitem ${project?.id === p.id ? 'on' : ''}`} aria-current={project?.id === p.id} onClick={() => { setSelected(p.id); setNewTask(''); }}>
                  <span className="col0">
                    <b>{p.name}</b>
                    <span className="mut small">{canEdit(p) ? counts(p) : `Owned by ${ownerName(p)}`}</span>
                  </span>
                  {p.leadId === me.id ? <Pill tone="blue">Yours</Pill> : !canEdit(p) && <Pill>View only</Pill>}
                </button>
              ))}
            </div>
          )}
        </Card>

        {project ? (
          <Card
            title={
              <span className="col0">
                <span className="row projtitle">{project.name} {project.active ? <Pill tone="ok">Active</Pill> : <Pill>Archived</Pill>}{!canEdit(project) && <Pill>View only</Pill>}</span>
                <span className="hsub">{project.description}{project.description && ' · '}Owner: {ownerName(project)}{project.visibility === 'private' && ' · Private'}</span>
              </span>
            }
            actions={canEdit(project) && (
              <span className="row">
                {project.active && <button className="btn ghost" onClick={() => setRename({ kind: 'project', id: project.id, name: project.name })}>Rename</button>}
                {project.active
                  ? <button className="btn ghost" onClick={() => run(() => api.archiveOption('project', project.id))}>Archive project</button>
                  : <button className="btn ghost" onClick={() => run(() => api.restoreOption('project', project.id))}>Restore project</button>}
              </span>
            )}
          >
            <div className="row between wrap">
              <h2>Tasks and items</h2>
              {editable && (
                <form className="row" onSubmit={(e) => { e.preventDefault(); const n = newTask.trim(); if (n) act.run(() => api.addTask(project.id, n), () => { setNewTask(''); reload(); }); }}>
                  <input aria-label="New task name" placeholder="New task name" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
                  <button className="btn ghost" disabled={!newTask.trim() || act.busy}>Add task</button>
                </form>
              )}
            </div>
            <ErrorBox msg={act.error ?? cat.error} />
            {c.tasks.filter((t) => t.projectId === project.id).length === 0 ? <Empty>No tasks yet.{editable && ' Add the first one above.'}</Empty> : (
              <div className="taskgrid3">
                {c.tasks.filter((t) => t.projectId === project.id).sort((a, b) => Number(b.active) - Number(a.active)).map((t) => (
                  <div key={t.id} className={`taskbox ${t.active ? '' : 'off'}`}>
                    <div className="optrow head">
                      <span className="row"><b>{t.name}</b>{!t.active && <Pill>Archived</Pill>}</span>
                      {links('task', t.id, t.name, t.active)}
                    </div>
                    {t.active && c.items.filter((i) => i.taskId === t.id).sort((a, b) => Number(b.active) - Number(a.active)).map((i) => (
                      <div key={i.id} className={`optrow ${i.active ? '' : 'off'}`}>
                        <span className="row">{i.name}{!i.active && <Pill>Archived</Pill>}</span>
                        {links('item', i.id, i.name, i.active)}
                      </div>
                    ))}
                    {editable && t.active && <AddInline label="+ Add item" onAdd={(n) => run(() => api.addItem(t.id, n))} />}
                  </div>
                ))}
              </div>
            )}
            <p className="small mut">Archived options disappear from the Activity dropdowns, but past entries keep their names. Nothing is deleted.</p>
          </Card>
        ) : <Card><Empty>Pick a project on the left.</Empty></Card>}
      </div>
      {rename && (
        <Modal title={`Rename ${rename.kind}`} onClose={() => setRename(null)} footer={<><button className="btn ghost" onClick={() => setRename(null)}>Cancel</button><button className="btn" disabled={!rename.name.trim()} onClick={() => act.run(() => api.renameOption(rename.kind, rename.id, rename.name.trim()), () => { setRename(null); reload(); })}>Save</button></>}>
          <Field label="New name"><input value={rename.name} onChange={(e) => setRename({ ...rename, name: e.target.value })} /></Field>
          <p className="small mut">The new name shows everywhere, including past entries.</p>
        </Modal>
      )}
    </>
  );
}

/** Where the new project's tasks come from. */
type Source = { kind: 'template'; id: number } | { kind: 'project'; id: number } | { kind: 'blank' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** '2026-10-02' -> '2 Oct 2026' */
const longDate = (d: string) => `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** New project: a full page (Setup › New project), not a dialog. */
function NewProjectPage({ c, templates, onCancel, onCreated }: { c: Catalog; templates: Template[]; onCancel: () => void; onCreated: (p: Project) => void }) {
  const me = useMe();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Project['visibility']>('public');
  const [ownerId, setOwnerId] = useState(me.id);
  const [source, setSource] = useState<Source | null>(null);
  const [copyFrom, setCopyFrom] = useState(0);
  const [tasks, setTasks] = useState<Draft[]>([]);
  const [newTask, setNewTask] = useState('');
  const [saveTpl, setSaveTpl] = useState(false);
  const act = useAction();

  const predefined = templates.filter((t) => t.ownerId === null);
  const saved = templates.filter((t) => t.ownerId !== null);
  const copyable = c.projects.filter((p) => p.active);
  const owners = me.role === 'team_lead' ? [me] : c.users.filter((u) => u.active && (u.role === 'team_lead' || u.role === 'manager' || u.id === me.id));

  const draftsFor = (src: Source): Draft[] => {
    if (src.kind === 'template') return fromTemplate(templates.find((t) => t.id === src.id));
    if (src.kind === 'project') {
      return c.tasks
        .filter((t) => t.projectId === src.id && t.active)
        .map((t) => ({ name: t.name, on: true, items: c.items.filter((i) => i.taskId === t.id && i.active).map((i) => ({ name: i.name, on: true })) }));
    }
    return [];
  };
  const choose = (src: Source) => { setSource(src); setTasks(draftsFor(src)); };

  // Start from the first predefined template once templates have loaded.
  useEffect(() => {
    if (!source && predefined.length) choose({ kind: 'template', id: predefined[0].id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates.length]);

  const upd = (ti: number, fn: (t: Draft) => Draft) => setTasks(tasks.map((t, i) => (i === ti ? fn(t) : t)));
  const chosen = tasks.filter((t) => t.on).map((t) => ({ name: t.name, items: t.items.filter((i) => i.on).map((i) => i.name) }));
  const itemCount = chosen.reduce((s, t) => s + t.items.length, 0);
  const untickedItems = tasks.filter((t) => t.on).reduce((s, t) => s + t.items.filter((i) => !i.on).length, 0);
  const untickedTasks = tasks.filter((t) => !t.on).length;
  const customTasks = tasks.filter((t) => t.on && t.custom).length;
  const customItems = tasks.filter((t) => t.on && !t.custom).reduce((s, t) => s + t.items.filter((i) => i.on && i.custom).length, 0);
  const summary = [
    `${plural(chosen.length, 'task')} and ${plural(itemCount, 'subtask')} will be created`,
    untickedTasks && `${plural(untickedTasks, 'task')} unticked`,
    untickedItems && `${plural(untickedItems, 'subtask')} unticked`,
    customTasks && `${plural(customTasks, 'custom task')} added`,
    customItems && `${plural(customItems, 'custom subtask')} added`,
  ].filter(Boolean).join(' · ');

  const srcTemplate = source?.kind === 'template' ? templates.find((t) => t.id === source.id) : undefined;
  const srcProject = source?.kind === 'project' ? c.projects.find((p) => p.id === source.id) : undefined;
  const fromLabel = srcTemplate ? 'From template' : srcProject ? `From ${srcProject.name}` : '';
  const projName = name.trim() || 'this project';
  const counts = (t: Template) => `${plural(t.tasks.length, 'task')} · ${plural(t.tasks.reduce((s, x) => s + x.items.length, 0), 'subtask')}`;
  const isOn = (src: Source) => !!source && source.kind === src.kind && (src.kind === 'blank' || (source as { id: number }).id === (src as { id: number }).id);
  const create = () => act.run(async () => onCreated(await api.createProject({ name: name.trim(), description, visibility, tasks: chosen, leadId: ownerId })));

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb"><Link to="/setup">Setup</Link> › <span>New project</span></nav>
      <PageHead
        title="New project"
        sub="Pick a template or category and its tasks and subtasks are filled in for you. Untick what you don't need, or add your own."
        actions={<><button className="btn ghost" onClick={onCancel}>Cancel</button><button className="btn" disabled={!name.trim() || act.busy} onClick={create}>Create project</button></>}
      />
      <ErrorBox msg={act.error} />
      <div className="npgrid">
        <Card>
          <h2 className="steph">1. Project details</h2>
          <Field label="Project name"><input value={name} maxLength={80} placeholder="For example: Delta" onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Description (optional)"><input value={description} maxLength={200} placeholder="What the project is for" onChange={(e) => setDescription(e.target.value)} /></Field>
          <Field label="Owner">
            <select value={ownerId} title={owners.length < 2 ? 'Team leads own the projects they create' : undefined} onChange={(e) => setOwnerId(Number(e.target.value))}>
              {owners.map((u) => <option key={u.id} value={u.id}>{u.name}{u.id === me.id ? ' (you)' : ''}</option>)}
            </select>
          </Field>
          <div className="fld">
            <span>Visibility</span>
            <div className="tiles2" role="radiogroup" aria-label="Visibility">
              <button type="button" role="radio" aria-checked={visibility === 'public'} className={`vtile ${visibility === 'public' ? 'on' : ''}`} onClick={() => setVisibility('public')}>
                <span className="row between"><b className="row">{Icon.globe} Public</b><Pill tone="blue">Default</Pill></span>
                <span className="mut small">Everyone can view it</span>
              </button>
              <button type="button" role="radio" aria-checked={visibility === 'private'} className={`vtile ${visibility === 'private' ? 'on' : ''}`} onClick={() => setVisibility('private')}>
                <b className="row">{Icon.lock} Private</b>
                <span className="mut small">Only members, leads and managers</span>
              </button>
            </div>
          </div>

          <h2 className="steph">2. Template or category</h2>
          <div className="tiles2" role="radiogroup" aria-label="Template or category">
            {predefined.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={isOn({ kind: 'template', id: t.id })} className={`vtile ${isOn({ kind: 'template', id: t.id }) ? 'on' : ''}`} onClick={() => choose({ kind: 'template', id: t.id })}>
                <b>{t.name}</b><span className="mut small">{counts(t)}</span>
              </button>
            ))}
            <button type="button" role="radio" aria-checked={source?.kind === 'project'} className={`vtile ${source?.kind === 'project' ? 'on' : ''}`} disabled={copyable.length === 0} onClick={() => { const id = copyFrom || copyable[0]?.id; if (id) { setCopyFrom(id); choose({ kind: 'project', id }); } }}>
              <b>Copy from a project</b><span className="mut small ell">Use {copyable.slice(0, 2).map((p) => p.name).join(', ')}{copyable.length > 2 ? '…' : ''}</span>
            </button>
            {saved.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={isOn({ kind: 'template', id: t.id })} className={`vtile ${isOn({ kind: 'template', id: t.id }) ? 'on' : ''}`} onClick={() => choose({ kind: 'template', id: t.id })}>
                <span className="row"><b>{t.name}</b>{t.approval === 'pending' ? <Pill tone="warn">Pending</Pill> : <Pill tone="blue">{t.ownerId === me.id ? 'Saved' : 'Shared'}</Pill>}</span>
                <span className="mut small">{t.ownerId === me.id ? 'Yours · ' : ''}{plural(t.tasks.length, 'task')} · {plural(t.tasks.reduce((s, x) => s + x.items.length, 0), 'item')}</span>
              </button>
            ))}
            <button type="button" role="radio" aria-checked={source?.kind === 'blank'} className={`vtile ${source?.kind === 'blank' ? 'on' : ''}`} onClick={() => choose({ kind: 'blank' })}>
              <b>Blank project</b><span className="mut small">Start with no tasks</span>
            </button>
          </div>
          {source?.kind === 'project' && (
            <Field label="Project to copy">
              <select value={copyFrom} onChange={(e) => { const id = Number(e.target.value); setCopyFrom(id); choose({ kind: 'project', id }); }}>
                {copyable.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          )}
          <p className="infobox">{Icon.info}<span>Changing the template replaces the inherited tasks. Edits here only affect {projName}; the template itself stays the same for everyone.</span></p>
        </Card>

        <Card
          title={
            <span className="col0">
              <span className="steph">3. Tasks and subtasks</span>
              <span className="hsub">
                {srcTemplate ? <>Filled in automatically from <b>{srcTemplate.name}</b>{srcTemplate.version && ` · template v${srcTemplate.version}`}{srcTemplate.updatedAt && `, updated ${longDate(srcTemplate.updatedAt)}`}{srcTemplate.updatedBy && ` by ${srcTemplate.updatedBy}`}</>
                  : srcProject ? <>Copied from the active tasks and items of <b>{srcProject.name}</b></>
                  : 'Blank project: add your own tasks below.'}
              </span>
            </span>
          }
          actions={
            <span className="row">
              <button className="btn ghost" disabled={!source || source.kind === 'blank'} onClick={() => source && choose(source)}>Reset to template</button>
              <button className="btn ghost" disabled={chosen.length === 0} onClick={() => setSaveTpl(true)}>{Icon.save} Save as template</button>
            </span>
          }
        >
          <p className="okbar">{Icon.check}<span>{summary}</span></p>
          <div className="taskgrid3">
            {tasks.map((t, ti) => (
              <div key={ti} className={`taskbox ${t.custom ? 'custom' : ''} ${t.on ? '' : 'off'}`}>
                <div className="optrow head">
                  <label className="chk"><input type="checkbox" checked={t.on} onChange={() => upd(ti, (x) => ({ ...x, on: !x.on }))} /><b>{t.name}</b></label>
                  {t.custom ? <Pill tone="warn">Custom</Pill> : fromLabel && <Pill tone="blue">{fromLabel}</Pill>}
                </div>
                {t.items.map((it, ii) => (
                  <label key={ii} className={`chk sub ${it.on && t.on ? '' : 'struck'}`}>
                    <input type="checkbox" disabled={!t.on} checked={it.on && t.on} onChange={() => upd(ti, (x) => ({ ...x, items: x.items.map((y, k) => (k === ii ? { ...y, on: !y.on } : y)) }))} />
                    <span>{it.name}</span>{it.custom && !t.custom && <span className="small mut">added</span>}
                  </label>
                ))}
                {t.on && <AddInline label="+ Add item" onAdd={(n) => upd(ti, (x) => ({ ...x, items: [...x.items, { name: n, on: true, custom: true }] }))} />}
              </div>
            ))}
            <form className="taskbox dashed addtask" onSubmit={(e) => { e.preventDefault(); const n = newTask.trim(); if (n) { setTasks([...tasks, { name: n, on: true, custom: true, items: [] }]); setNewTask(''); } }}>
              <input aria-label="New task name" placeholder="New task name" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
              <button className="btn ghost wide" disabled={!newTask.trim()}>+ Add task</button>
            </form>
          </div>
          <p className="small mut">Ticked tasks and items appear in the Activity dropdown for {projName} as soon as the project is created. You can still rename or archive them later in Setup. Add members to the project in Assignments.</p>
        </Card>
      </div>
      {saveTpl && <SaveTemplate tasks={tasks} onClose={() => setSaveTpl(false)} />}
    </>
  );
}

function AddInline({ label, onAdd }: { label: string; onAdd: (name: string) => void }) {
  const [v, setV] = useState<string | null>(null);
  if (v === null) return <button className="link addlink" onClick={() => setV('')}>{label}</button>;
  return (
    <form className="row addinline" onSubmit={(e) => { e.preventDefault(); if (v.trim()) onAdd(v.trim()); setV(null); }}>
      <input autoFocus value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setV(null)} aria-label="Name" placeholder="Item name" />
      <button className="btn" disabled={!v.trim()}>Add</button>
    </form>
  );
}

function SaveTemplate({ tasks, onClose }: { tasks: Draft[]; onClose: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Development');
  const [sharing, setSharing] = useState<Template['sharing']>('only_me');
  const [includeAll, setIncludeAll] = useState(false);
  const [saved, setSaved] = useState<Template | null>(null);
  const act = useAction();
  const body = tasks.filter((t) => includeAll || t.on).map((t) => ({ name: t.name, items: t.items.filter((i) => includeAll || i.on).map((i) => i.name) }));
  return (
    <Modal title="Save as template" onClose={onClose} footer={saved ? <button className="btn" onClick={onClose}>Done</button> : <><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={!name.trim() || act.busy} onClick={() => act.run(async () => setSaved(await api.saveTemplate({ name, category, sharing, tasks: body })))}>Save</button></>}>
      {saved ? (
        <p>{saved.approval === 'pending' ? `"${saved.name}" is saved and waits for Manager approval before everyone can use it.` : `"${saved.name}" is saved.`}</p>
      ) : (
        <>
          <Field label="Template name"><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Category"><input value={category} onChange={(e) => setCategory(e.target.value)} /></Field>
          <fieldset className="col">
            <legend className="small mut">Share with</legend>
            <label className="radio"><input type="radio" checked={sharing === 'only_me'} onChange={() => setSharing('only_me')} />Only me</label>
            <label className="radio"><input type="radio" checked={sharing === 'my_team'} onChange={() => setSharing('my_team')} />My team</label>
            <label className="radio"><input type="radio" checked={sharing === 'everyone'} onChange={() => setSharing('everyone')} />Everyone (needs Manager approval)</label>
          </fieldset>
          <label className="radio"><input type="checkbox" checked={includeAll} onChange={() => setIncludeAll(!includeAll)} />Include unticked tasks and items</label>
          <ErrorBox msg={act.error} />
        </>
      )}
    </Modal>
  );
}
