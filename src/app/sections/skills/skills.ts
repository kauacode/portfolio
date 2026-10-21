import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PROFILE, TODAY } from '../../core/content/content.tokens';
import { usesSkill, type CoreSkill } from '../../core/content/profile.model';
import { unionMonths } from '../../core/dates';
import { Locale } from '../../core/i18n/locale';
import { SectionHead } from '../page-section';

@Component({
  selector: 'section[appSkills]',
  imports: [SectionHead],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <div appSectionHead="skills" color="purple" [heading]="locale.text().skills_title"></div>
      <h3 class="label">{{ locale.text().skills_core }}</h3>
      <ul class="core">
        @for (skill of core(); track skill.name) {
          <li class="core-item">
            <span class="core-name">{{ skill.name }}</span>
            @if (skill.detail) {
              <span class="core-detail">{{ skill.detail }}</span>
            }
            @if (skill.usage) {
              <span class="core-usage">{{ skill.usage }}</span>
            }
          </li>
        }
      </ul>
      <h3 class="label skills-more">{{ locale.text().skills_more }}</h3>
      <dl class="skill-rows">
        @for (group of profile.skillGroups; track $index) {
          <div>
            <dt>{{ group.title[locale.lang()] }}</dt>
            <dd>
              <ul class="items">
                @for (item of group.items; track $index) {
                  <li>{{ item[locale.lang()] }}</li>
                }
              </ul>
            </dd>
          </div>
        }
      </dl>
    </div>
  `,
})
export class Skills {
  protected readonly locale = inject(Locale);
  protected readonly profile = inject(PROFILE);
  private readonly today = inject(TODAY);

  protected readonly core = computed(() =>
    this.profile.coreSkills.map((skill) => ({
      name: skill.name,
      detail: skill.detail?.[this.locale.lang()] ?? null,
      usage: this.usage(skill),
    })),
  );

  private usage(skill: CoreSkill): string | null {
    const companies = this.profile.experience.filter((c) => c.roles.some((r) => usesSkill(r, skill)));
    const roles = companies.flatMap((c) => c.roles.filter((r) => usesSkill(r, skill)));
    if (!roles.length) return null;
    const i18n = this.locale.i18n();
    const duration = i18n.duration(
      unionMonths(
        roles.map((r) => r.period),
        this.today,
      ),
    );
    const names = companies.map((c) => c.displayName).join(', ');
    return `${i18n.fmt(i18n.text.skills_used_at, { duration })} · ${names}`;
  }
}
