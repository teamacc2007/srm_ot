import { Component, EventEmitter, Input, Output } from "@angular/core"
import { CommonModule } from "@angular/common"
import type { Module } from "../types"
import { modules } from "../data/mock"
import { IconComponent } from "./icon.component"

interface NavItem {
  id: string
  label: string
  icon: string
}

const moduleNav: Record<string, NavItem[]> = {
  "surgery-op-ward": [
    { id: "dashboard", label: "Dashboard", icon: "home" },
    { id: "all-patients", label: "All Patients", icon: "list" },
    { id: "ot-schedule", label: "OT Schedule", icon: "calendar" },
    { id: "analysis", label: "Analysis", icon: "piechart" },
  ],
  "anaesthesia-op-pac": [
    { id: "dashboard", label: "Dashboard", icon: "home" },
    { id: "pre-habilitation", label: "Pre-Habilitation", icon: "clipboard" },
    { id: "all-patients", label: "All Patients", icon: "list" },
    { id: "analysis", label: "Analysis", icon: "piechart" },
  ],
  "department-hod": [
    { id: "dashboard", label: "Dashboard", icon: "home" },
    { id: "all-patients", label: "All Patients", icon: "list" },
    { id: "analysis", label: "Analysis", icon: "piechart" },
  ],
  "ot-matron": [
    { id: "dashboard", label: "Dashboard", icon: "home" },
    { id: "ot-rooms", label: "OT Rooms", icon: "grid" },
    { id: "patient-list", label: "Today's Patients", icon: "users" },
    { id: "all-patients", label: "All Patients", icon: "list" },
    { id: "analysis", label: "Analysis", icon: "piechart" },
  ],
  "hod-anaesthesia": [
    { id: "dashboard", label: "Dashboard", icon: "home" },
    { id: "patient-list", label: "Today's Patients", icon: "users" },
    { id: "all-patients", label: "All Patients", icon: "list" },
    { id: "analysis", label: "Analysis", icon: "piechart" },
  ],
  "hospital-admin": [
    { id: "dashboard", label: "Dashboard", icon: "home" },
    { id: "ot-master", label: "OT Master Schedule", icon: "grid" },
    { id: "ot-rooms", label: "OT Rooms", icon: "building" },
    { id: "analysis", label: "Analysis", icon: "piechart" },
    { id: "all-patients", label: "All Patients", icon: "list" },
  ],
}

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="flex h-screen bg-white overflow-hidden">
      <!-- Sidebar -->
      <aside
        class="flex-shrink-0 flex flex-col transition-all duration-200"
        [style.width]="collapsed ? '52px' : '224px'"
        style="background-color: #0F1E37;"
      >
        <!-- Logo + toggle -->
        <div class="px-3 py-3 border-b flex items-center gap-2" style="border-color: rgba(255,255,255,0.08);">
          <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          @if (!collapsed) {
            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold text-white leading-tight tracking-wide">SRM OTS</div>
              <div class="text-[9px] text-slate-400 tracking-wider uppercase">Operation Theater</div>
            </div>
          }
          <button
            (click)="toggleCollapse()"
            class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors flex-shrink-0 cursor-pointer"
            [title]="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              @if (collapsed) {
                <polyline points="9 18 15 12 9 6" />
              } @else {
                <polyline points="15 18 9 12 15 6" />
              }
            </svg>
          </button>
        </div>

        <!-- Module Switcher -->
        @if (!collapsed) {
          <div class="px-3 py-2 border-b" style="border-color: rgba(255,255,255,0.08);">
            <button
              (click)="moduleDropdown = !moduleDropdown"
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div class="w-5 h-5 rounded bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                <app-icon name="user" [size]="11" className="text-blue-300"></app-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[10px] text-slate-400 leading-tight">Module</div>
                <div class="text-xs font-medium text-white truncate leading-tight mt-0.5">{{ currentModule.label }}</div>
              </div>
              <app-icon
                name="chevron-down"
                [size]="12"
                [className]="'text-slate-400 transition-transform flex-shrink-0 ' + (moduleDropdown ? 'rotate-180' : '')"
              ></app-icon>
            </button>
            @if (moduleDropdown) {
              <div class="mt-1 rounded border overflow-hidden" style="background-color: #0B1627; border-color: rgba(255,255,255,0.1);">
                @for (m of allModules; track m.id) {
                  <button
                    (click)="selectModule(m.id)"
                    class="w-full text-left px-3 py-1.5 text-xs transition-colors block hover:bg-white/10 cursor-pointer"
                    [class.text-blue-400]="m.id === currentModule.id"
                    [class.font-medium]="m.id === currentModule.id"
                    [class.text-slate-300]="m.id !== currentModule.id"
                  >
                    {{ m.label }}
                  </button>
                }
              </div>
            }
          </div>
        }

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto px-1.5 py-2 space-y-0.5">
          @for (item of getNavItems(); track item.id) {
            <button
              (click)="onPageClick(item.id)"
              [title]="collapsed ? item.label : ''"
              class="w-full flex items-center gap-2.5 rounded text-left transition-colors text-xs font-medium cursor-pointer"
              [class.justify-center]="collapsed"
              [class.px-0]="collapsed"
              [class.py-2]="true"
              [class.px-2.5]="!collapsed"
              [class.bg-blue-600]="activePage === item.id"
              [class.text-white]="activePage === item.id"
              [class.text-slate-300]="activePage !== item.id"
              [class.hover:text-white]="activePage !== item.id"
              [class.hover:bg-white/10]="activePage !== item.id"
            >
              <app-icon
                [name]="item.icon"
                [size]="15"
                [className]="activePage === item.id ? 'text-white' : 'text-slate-400'"
              ></app-icon>
              @if (!collapsed) {
                <span>{{ item.label }}</span>
              }
            </button>
          }
        </nav>

        <!-- Bottom user -->
        <div class="px-2 py-3 border-t flex-shrink-0" style="border-color: rgba(255,255,255,0.08);">
          @if (collapsed) {
            <div class="flex justify-center">
              <div class="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center">
                <span class="text-[10px] font-bold text-white">
                  {{ userInitials }}
                </span>
              </div>
            </div>
          } @else {
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
                <span class="text-[10px] font-bold text-white">
                  {{ userInitials }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-medium text-white truncate">{{ currentModule.user }}</div>
                <div class="text-[10px] text-slate-400 truncate">{{ currentModule.role }}</div>
              </div>
              <button class="text-slate-500 hover:text-slate-300 transition-colors p-0.5 cursor-pointer">
                <app-icon name="logout" [size]="13"></app-icon>
              </button>
            </div>
          }
        </div>
      </aside>

      <!-- Main content area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <header class="h-10 border-b border-slate-200 bg-white flex items-center px-5 gap-3 flex-shrink-0">
          <div class="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
            <span class="text-slate-600 font-medium">{{ currentModule.label }}</span>
            @if (breadcrumb) {
              <span>/</span>
              <span class="text-slate-400 truncate">{{ breadcrumb }}</span>
            }
          </div>
          <div class="flex-1"></div>
          <span class="text-xs text-slate-500 font-medium">{{ currentModule.role }}</span>
        </header>

        <main class="flex-1 overflow-hidden bg-slate-50">
          <ng-content></ng-content>
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {
  @Input() currentModule: Module
  @Input() activePage: string = "dashboard"
  @Input() breadcrumb?: string

  @Output() pageChange = new EventEmitter<string>()
  @Output() moduleChange = new EventEmitter<string>()

  collapsed = false
  moduleDropdown = false
  allModules = modules

  get userInitials(): string {
    if (!this.currentModule?.user) return "U"
    return this.currentModule.user
      .split(" ")
      .filter((n) => /^[A-Z]/.test(n))
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
  }

  getNavItems(): NavItem[] {
    return moduleNav[this.currentModule?.id] ?? []
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed
    this.moduleDropdown = false
  }

  selectModule(id: string) {
    this.moduleChange.emit(id)
    this.moduleDropdown = false
  }

  onPageClick(id: string) {
    this.pageChange.emit(id)
  }
}
