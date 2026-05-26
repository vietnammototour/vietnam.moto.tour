export type CodemodMapping = {
  fromNamespace: string;
  fromKey: string;
  toKey: string;
};

export type Change = {
  fromNamespace: string;
  fromKey: string;
  toKey: string;
  alias: string;
};

export type ManualEntry = {reason: string};

export type RewriteResult = {
  output: string;
  changes: Change[];
  manual: ManualEntry[];
};

function escRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findHookBinding(
  source: string,
  namespace: string,
): {binding: string} | {destructured: true} | null {
  const ns = escRe(namespace);
  const re = new RegExp(
    `const\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*useTranslations\\(\\s*['"]${ns}['"]\\s*\\)\\s*;?`,
    'm',
  );
  const m = re.exec(source);
  if (m) return {binding: m[1]};
  const destructRe = new RegExp(
    `const\\s*\\{[^}]*\\}\\s*=\\s*useTranslations\\(\\s*['"]${ns}['"]\\s*\\)`,
    'm',
  );
  if (destructRe.test(source)) return {destructured: true};
  return null;
}

function findExistingCommonAlias(source: string): string | null {
  const re =
    /const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*useTranslations\(\s*['"]common['"]\s*\)/m;
  const m = re.exec(source);
  return m ? m[1] : null;
}

function pickAlias(source: string, preferred: string): string {
  if (!new RegExp(`\\b${preferred}\\b`).test(source)) return preferred;
  let n = 2;
  while (new RegExp(`\\b${preferred}${n}\\b`).test(source)) n++;
  return `${preferred}${n}`;
}

export function rewriteSource(
  _filename: string,
  source: string,
  mappings: CodemodMapping[],
): RewriteResult {
  let output = source;
  const changes: Change[] = [];
  const manual: ManualEntry[] = [];

  const byNs = new Map<string, CodemodMapping[]>();
  for (const m of mappings) {
    const bucket = byNs.get(m.fromNamespace) ?? [];
    bucket.push(m);
    byNs.set(m.fromNamespace, bucket);
  }

  for (const [ns, group] of byNs) {
    const hook = findHookBinding(output, ns);
    if (!hook) continue;
    if ('destructured' in hook) {
      manual.push({
        reason: `Destructured useTranslations('${ns}') — rewrite manually.`,
      });
      continue;
    }

    const {binding} = hook;

    let alias = findExistingCommonAlias(output);
    let mustInject = false;
    if (!alias) {
      alias = pickAlias(output, 'tc');
      mustInject = true;
    }

    let touched = false;
    for (const m of group) {
      const callRe = new RegExp(
        `\\b${binding}\\(\\s*(['"\`])${escRe(m.fromKey)}\\1\\s*\\)`,
        'g',
      );
      if (!callRe.test(output)) continue;
      output = output.replace(callRe, `${alias}('${m.toKey}')`);
      changes.push({
        fromNamespace: m.fromNamespace,
        fromKey: m.fromKey,
        toKey: m.toKey,
        alias,
      });
      touched = true;
    }

    if (touched && mustInject) {
      const reFresh = new RegExp(
        `const\\s+${binding}\\s*=\\s*useTranslations\\(\\s*['"]${escRe(ns)}['"]\\s*\\)\\s*;?`,
        'm',
      );
      const m2 = reFresh.exec(output);
      if (m2) {
        const insertAt = m2.index + m2[0].length;
        const injection = `\n  const ${alias} = useTranslations('common');`;
        output = output.slice(0, insertAt) + injection + output.slice(insertAt);
      }
    }
  }

  return {output, changes, manual};
}
