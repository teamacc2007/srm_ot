import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { IconComponent } from "./icon.component"

// ─── Status Badge ──────────────────────────────────────────────────────────────

const badgeStyles: Record<string, string> = {
  // Workflow statuses
  draft: "bg-slate-100 text-slate-500 border-slate-200",
  pending_fitness: "bg-sky-50 text-sky-700 border-sky-200",
  pending_scheduling: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ready_for_hod_approval: "bg-yellow-50 text-yellow-700 border-yellow-200",
  pending_dept_approval: "bg-orange-50 text-orange-700 border-orange-200",
  pending_ot_assignment: "bg-violet-50 text-violet-700 border-violet-200",
  pending_anaes_approval: "bg-purple-50 text-purple-700 border-purple-200",
  // Core statuses
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  "in-progress": "bg-amber-50 text-amber-800 border-amber-200",
  in_progress: "bg-amber-50 text-amber-800 border-amber-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  postponed: "bg-orange-50 text-orange-700 border-orange-200",
  holding: "bg-purple-50 text-purple-700 border-purple-200",
  // PAC statuses
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  cleared: "bg-green-50 text-green-700 border-green-200",
  "high-risk": "bg-red-50 text-red-700 border-red-200",
  deferred: "bg-orange-50 text-orange-700 border-orange-200",
  "not-required": "bg-slate-100 text-slate-500 border-slate-200",
  // Priority
  elective: "bg-slate-100 text-slate-600 border-slate-200",
  urgent: "bg-amber-50 text-amber-700 border-amber-200",
  emergency: "bg-red-50 text-red-700 border-red-200",
  // ASA
  "ASA-I": "bg-green-50 text-green-700 border-green-200",
  "ASA-II": "bg-blue-50 text-blue-700 border-blue-200",
  "ASA-III": "bg-amber-50 text-amber-700 border-amber-200",
  "ASA-IV": "bg-red-50 text-red-700 border-red-200",
  "ASA-V": "bg-red-100 text-red-900 border-red-300",
  // OT room
  available: "bg-green-50 text-green-700 border-green-200",
  occupied: "bg-amber-50 text-amber-700 border-amber-200",
  cleaning: "bg-blue-50 text-blue-700 border-blue-200",
  maintenance: "bg-slate-100 text-slate-500 border-slate-200",
}

const badgeLabels: Record<string, string> = {
  draft: "New Request",
  pending_fitness: "Pending PAC",
  pending_scheduling: "Pending Scheduling",
  ready_for_hod_approval: "Ready for HOD",
  pending_dept_approval: "HOD Review",
  pending_ot_assignment: "OT Assignment",
  pending_anaes_approval: "Anaes. Approval",
  "in-progress": "Surgery Going On",
  in_progress: "Surgery Going On",
  "high-risk": "High Risk",
  "not-required": "Not Required",
  "ASA-I": "ASA I",
  "ASA-II": "ASA II",
  "ASA-III": "ASA III",
  "ASA-IV": "ASA IV",
  "ASA-V": "ASA V",
}

@Component({
  selector: "app-status-badge",
  standalone: true,
  template: `
    <span [class]="computedClass">
      @if (dot) {
        <span class="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0"></span>
      }
      {{ label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() value: string = "draft"
  @Input() size: "sm" | "md" = "sm"
  @Input() dot: boolean = false

  get label(): string {
    return (
      badgeLabels[this.value] ??
      (this.value
        ? this.value.charAt(0).toUpperCase() + this.value.slice(1)
        : "")
    )
  }

  get computedClass(): string {
    const cls =
      badgeStyles[this.value] ?? "bg-slate-100 text-slate-600 border-slate-200"
    const px =
      this.size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
    return `inline-flex items-center gap-1 rounded border font-medium font-sans tracking-wide whitespace-nowrap ${px} ${cls}`
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────

@Component({
  selector: "app-modal",
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" (click)="close.emit()"></div>
        <div [class]="modalClass">
          <div class="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
            <div>
              <h2 class="text-base font-semibold text-slate-900">{{ title }}</h2>
              @if (subtitle) {
                <p class="text-xs text-slate-500 mt-0.5">{{ subtitle }}</p>
              }
            </div>
            <button (click)="close.emit()" class="text-slate-400 hover:text-slate-600 p-0.5 rounded ml-4 flex-shrink-0 cursor-pointer">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-5 py-4">
            <ng-content></ng-content>
          </div>
          <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2 flex-shrink-0">
            <ng-content select="[modal-footer]"></ng-content>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  @Input() open: boolean = false
  @Input() title: string = ""
  @Input() subtitle: string = ""
  @Input() width: "sm" | "md" | "lg" | "xl" = "md"
  @Output() close = new EventEmitter<void>()

  get modalClass(): string {
    const widths = {
      sm: "max-w-sm",
      md: "max-w-lg",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
    }
    return `relative bg-white rounded-lg shadow-xl border border-slate-200 w-full ${widths[this.width]} flex flex-col max-h-[90vh]`
  }
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

@Component({
  selector: "app-confirm-dialog",
  standalone: true,
  imports: [ModalComponent],
  template: `
    <app-modal [open]="open" (close)="close.emit()" [title]="title" width="sm">
      <p class="text-sm text-slate-600">{{ message }}</p>
      <div modal-footer class="flex justify-end gap-2 w-full mt-2">
        <button
          type="button"
          (click)="close.emit()"
          class="h-8 px-3 text-sm font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          (click)="confirm.emit()"
          [class]="variant === 'danger'
            ? 'h-8 px-3 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer'
            : 'h-8 px-3 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer'"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </app-modal>
  `,
})
export class ConfirmDialogComponent {
  @Input() open: boolean = false
  @Input() title: string = "Confirm"
  @Input() message: string = ""
  @Input() confirmLabel: string = "Confirm"
  @Input() variant: "primary" | "danger" = "primary"
  @Output() close = new EventEmitter<void>()
  @Output() confirm = new EventEmitter<void>()
}

// ─── DashTile ─────────────────────────────────────────────────────────────────

const TILE_CFG: Record<string, {
  bar: string
  bg: string
  text: string
  iconBox: string
  activeBorder: string
}> = {
  blue: {
    bar: "bg-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    iconBox: "bg-blue-100 text-blue-600",
    activeBorder: "border-blue-400",
  },
  amber: {
    bar: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    iconBox: "bg-amber-100 text-amber-600",
    activeBorder: "border-amber-400",
  },
  green: {
    bar: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    iconBox: "bg-emerald-100 text-emerald-600",
    activeBorder: "border-emerald-400",
  },
  red: {
    bar: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    iconBox: "bg-red-100 text-red-600",
    activeBorder: "border-red-400",
  },
  slate: {
    bar: "bg-slate-400",
    bg: "bg-slate-100",
    text: "text-slate-600",
    iconBox: "bg-slate-200 text-slate-500",
    activeBorder: "border-slate-400",
  },
  violet: {
    bar: "bg-violet-500",
    bg: "bg-violet-50",
    text: "text-violet-700",
    iconBox: "bg-violet-100 text-violet-600",
    activeBorder: "border-violet-400",
  },
  rose: {
    bar: "bg-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-700",
    iconBox: "bg-rose-100 text-rose-600",
    activeBorder: "border-rose-400",
  },
  sky: {
    bar: "bg-sky-500",
    bg: "bg-sky-50",
    text: "text-sky-700",
    iconBox: "bg-sky-100 text-sky-600",
    activeBorder: "border-sky-400",
  },
  indigo: {
    bar: "bg-indigo-500",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    iconBox: "bg-indigo-100 text-indigo-600",
    activeBorder: "border-indigo-400",
  },
  orange: {
    bar: "bg-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-700",
    iconBox: "bg-orange-100 text-orange-600",
    activeBorder: "border-orange-400",
  },
}

@Component({
  selector: "app-dash-tile",
  standalone: true,
  imports: [IconComponent],
  template: `
    <button
      type="button"
      (click)="clicked.emit()"
      [class]="containerClass"
    >
      <div [class]="'absolute left-0 top-0 bottom-0 w-1 ' + cfg.bar"></div>
      <div class="pl-4 pr-3 py-4">
        <div class="flex items-start justify-between gap-2">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-tight">{{ label }}</p>
          @if (icon) {
            <div [class]="'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ' + (active ? cfg.iconBox : 'bg-slate-100 text-slate-400')">
              <app-icon [name]="icon" [size]="15"></app-icon>
            </div>
          }
        </div>
        <p [class]="'text-3xl font-bold mt-2 leading-none tabular-nums ' + (active ? cfg.text : 'text-slate-900')">
          {{ value }}
        </p>
        @if (active) {
          <p class="text-[10px] mt-1.5 font-medium text-slate-400">Click to clear filter</p>
        }
      </div>
    </button>
  `,
})
export class DashTileComponent {
  @Input() label: string = ""
  @Input() value: number | string = 0
  @Input() color: string = "blue"
  @Input() icon?: string
  @Input() active: boolean = false
  @Output() clicked = new EventEmitter<void>()

  get cfg() {
    return TILE_CFG[this.color] ?? TILE_CFG["blue"]
  }

  get containerClass(): string {
    const base =
      "relative text-left rounded-xl overflow-hidden transition-all duration-150 cursor-pointer w-full "
    return this.active
      ? `${base} ${this.cfg.bg} border-2 ${this.cfg.activeBorder} shadow-sm`
      : `${base} bg-white border border-slate-200 hover:shadow-md hover:border-slate-300`
  }
}

// ─── StatusFilterDropdown ────────────────────────────────────────────────────

const PENDING_SUB = [
  { value: "pending_fitness", label: "Pending Fitness" },
  { value: "pending_scheduling", label: "Pending Scheduling" },
  { value: "pending_dept_approval", label: "Pending HOD Approval" },
  { value: "pending_ot_assignment", label: "Pending OT" },
  { value: "pending_anaes_approval", label: "Pending Anaesthesia" },
]

const STATUS_TOP_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "draft", label: "New Request" },
  { value: "requested", label: "Requested" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "Surgery Going On" },
  { value: "postponed", label: "Postponed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

@Component({
  selector: "app-status-filter-dropdown",
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="relative inline-block" [class]="className">
      <button
        type="button"
        (click)="open = !open"
        class="h-8 pl-3 pr-7 text-xs border border-slate-200 rounded bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400 flex items-center gap-2 min-w-[140px] relative cursor-pointer"
      >
        <span class="flex-1 text-left truncate">{{ displayLabel }}</span>
        <app-icon
          name="chevron-down"
          [size]="12"
          [className]="'absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ' + (open ? 'rotate-180' : '')"
        ></app-icon>
      </button>

      @if (open) {
        <div class="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[190px] py-1">
          @for (opt of topOptions; track opt.value) {
            <button
              type="button"
              (click)="pick(opt.value)"
              [class]="'w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors cursor-pointer ' + (value === opt.value ? 'text-blue-600 font-semibold' : 'text-slate-700')"
            >
              {{ opt.label }}
            </button>
          }

          <div class="border-t border-slate-100 mt-1 pt-1">
            <button
              type="button"
              (click)="pendingOpen = !pendingOpen"
              [class]="'w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ' + (isPending ? 'text-blue-600 font-semibold' : 'text-slate-700')"
            >
              <span>Pending</span>
              <app-icon
                name="chevron-down"
                [size]="10"
                [className]="'transition-transform ' + (pendingOpen ? 'rotate-180' : '')"
              ></app-icon>
            </button>
            @if (pendingOpen) {
              <div class="bg-slate-50 border-t border-slate-100">
                @for (opt of pendingSubOptions; track opt.value) {
                  <button
                    type="button"
                    (click)="pick(opt.value)"
                    [class]="'w-full text-left pl-6 pr-3 py-1.5 text-xs hover:bg-blue-50 transition-colors cursor-pointer ' + (value === opt.value ? 'text-blue-600 font-semibold' : 'text-slate-600')"
                  >
                    {{ opt.label }}
                  </button>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class StatusFilterDropdownComponent {
  @Input() value: string = ""
  @Input() className: string = ""
  @Output() valueChange = new EventEmitter<string>()

  open: boolean = false
  pendingOpen: boolean = false

  topOptions = STATUS_TOP_OPTIONS
  pendingSubOptions = PENDING_SUB

  get isPending(): boolean {
    return PENDING_SUB.some((o) => o.value === this.value)
  }

  get displayLabel(): string {
    const sub = PENDING_SUB.find((o) => o.value === this.value)
    if (sub) return `Pending › ${sub.label}`
    return (
      STATUS_TOP_OPTIONS.find((o) => o.value === this.value)?.label ??
      (this.value || "All Status")
    )
  }

  pick(val: string) {
    this.valueChange.emit(val)
    this.open = false
    this.pendingOpen = false
  }

  constructor(private elementRef: ElementRef) {}

  @HostListener("document:mousedown", ["$event"])
  onGlobalClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.open = false
    }
  }
}

// ─── DeptFilterSelect ────────────────────────────────────────────────────────

@Component({
  selector: "app-dept-filter-select",
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    @if (otherMode) {
      <div class="flex items-center gap-1">
        <input
          #otherInput
          [value]="value"
          (input)="onChangeInput($event)"
          placeholder="Search department…"
          class="h-8 pl-3 pr-2 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          type="button"
          (click)="otherMode = false; valueChange.emit('')"
          class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 cursor-pointer"
        >
          <app-icon name="x" [size]="10"></app-icon>
        </button>
      </div>
    } @else {
      <select
        [value]="value"
        (change)="onSelectChange($event)"
        class="h-8 pl-3 pr-7 text-xs border border-slate-200 rounded bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
      >
        <option value="">All Departments</option>
        @for (d of departments; track d) {
          <option [value]="d">{{ d }}</option>
        }
        <option value="__others__">Others…</option>
      </select>
    }
  `,
})
export class DeptFilterSelectComponent {
  @Input() value: string = ""
  @Input() departments: string[] = []
  @Output() valueChange = new EventEmitter<string>()

  otherMode: boolean = false

  onSelectChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value
    if (val === "__others__") {
      this.otherMode = true
      this.valueChange.emit("")
    } else {
      this.valueChange.emit(val)
    }
  }

  onChangeInput(event: Event) {
    const val = (event.target as HTMLInputElement).value
    this.valueChange.emit(val)
  }
}

// ─── OTTimeline ──────────────────────────────────────────────────────────────

export interface OTSlot {
  roomId: string
  patientName: string
  surgery: string
  startHour: number
  durationHours: number
  status: string
  patientId?: string
}

const otBlockColors: Record<string, string> = {
  "in-progress": "bg-blue-500 text-white shadow-blue-200",
  in_progress: "bg-blue-500 text-white shadow-blue-200",
  confirmed: "bg-violet-500 text-white shadow-violet-200",
  scheduled: "bg-emerald-500 text-white shadow-emerald-200",
  completed: "bg-slate-400 text-white",
  holding: "bg-amber-500 text-white shadow-amber-200",
  cancelled: "bg-red-400 text-white opacity-60",
  postponed: "bg-orange-400 text-white",
}

@Component({
  selector: "app-ot-timeline",
  standalone: true,
  template: `
    <div class="overflow-x-auto">
      <div style="min-width: 860px;">
        <!-- Hour header -->
        <div class="flex border-b-2 border-slate-200">
          <div class="flex-shrink-0 px-4 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border-r border-slate-200" style="width: 160px;">
            OT ROOM
          </div>
          @for (h of hours; track h) {
            <div class="flex-1 text-center py-2.5 border-r border-slate-100 last:border-0 bg-slate-50">
              <span class="text-[11px] font-semibold font-mono text-slate-500">
                {{ h < 10 ? '0' + h : h }}:00
              </span>
            </div>
          }
        </div>

        <!-- Rows -->
        @for (room of rooms; track room.id; let ri = $index) {
          <div
            [class]="'flex border-b border-slate-100 relative ' + (ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/40')"
            style="height: 62px;"
          >
            <div class="flex-shrink-0 px-4 flex flex-col justify-center border-r border-slate-200" style="width: 160px;">
              <span class="text-xs font-bold text-slate-800 leading-tight">{{ room.name }}</span>
              <span class="text-[10px] text-slate-400 mt-0.5 truncate leading-tight">{{ room.specialization }}</span>
            </div>

            <div class="flex-1 relative">
              <!-- Grid lines -->
              @for (h of hours; track h; let i = $index) {
                <div
                  class="absolute top-0 bottom-0 border-r border-slate-100"
                  [style.left]="(i / otHours) * 100 + '%'"
                  [style.width]="(1 / otHours) * 100 + '%'"
                ></div>
              }

              <!-- Case blocks -->
              @for (slot of getRoomSlots(room.id); track slot.patientId || slot.patientName; let si = $index) {
                <div
                  [class]="'absolute top-2 bottom-2 rounded-md px-2 flex flex-col justify-center overflow-hidden shadow-sm cursor-pointer hover:brightness-90 hover:scale-[1.01] transition-all ' + getSlotColor(slot.status)"
                  [style.left]="getSlotLeft(slot) + '%'"
                  [style.width]="'calc(' + getSlotWidth(slot) + '% - 4px)'"
                  [title]="slot.patientName + ' — ' + slot.surgery"
                  (click)="onSlotClicked(slot, $event)"
                >
                  <span class="text-[11px] font-bold leading-tight truncate">{{ slot.patientName }}</span>
                  <span class="text-[10px] opacity-80 leading-tight truncate mt-0.5">{{ slot.surgery }}</span>
                </div>
              }

              @if (getRoomSlots(room.id).length === 0) {
                <div class="absolute inset-0 flex items-center px-4">
                  <span class="text-[10px] text-slate-300 italic">No cases</span>
                </div>
              }
            </div>
          </div>
        }

        @if (rooms.length === 0) {
          <div class="text-center py-12 text-slate-400 text-sm">No OT rooms configured.</div>
        }
      </div>
    </div>
  `,
})
export class OTTimelineComponent {
  @Input() rooms: Array<{ id: string; name: string; specialization: string }> = []
  @Input() slots: OTSlot[] = []
  @Output() slotClick = new EventEmitter<{ slot: OTSlot; event: MouseEvent }>()

  readonly otStart = 8
  readonly otEnd = 18
  readonly otHours = this.otEnd - this.otStart
  readonly hours = Array.from(
    { length: this.otHours },
    (_, i) => i + this.otStart,
  )

  getRoomSlots(roomId: string): OTSlot[] {
    return this.slots.filter((s) => s.roomId === roomId)
  }

  getSlotColor(status: string): string {
    return otBlockColors[status] ?? otBlockColors["scheduled"]
  }

  getSlotLeft(slot: OTSlot): number {
    const rawLeft = ((slot.startHour - this.otStart) / this.otHours) * 100
    return Math.max(0, Math.min(rawLeft, 100))
  }

  getSlotWidth(slot: OTSlot): number {
    const left = this.getSlotLeft(slot)
    const rawWidth = (slot.durationHours / this.otHours) * 100
    return Math.min(rawWidth, 100 - left)
  }

  onSlotClicked(slot: OTSlot, event: MouseEvent) {
    event.stopPropagation()
    this.slotClick.emit({ slot, event })
  }
}

// ─── OTSlotPopup ─────────────────────────────────────────────────────────────

@Component({
  selector: "app-ot-slot-popup",
  standalone: true,
  imports: [IconComponent],
  template: `
    <div
      class="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-4"
      [style.left.px]="popupLeft"
      [style.top.px]="popupTop"
      style="width: 340px;"
    >
      <div class="flex items-center justify-between mb-3">
        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient Details</p>
        <button
          type="button"
          (click)="close.emit()"
          class="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <app-icon name="x" [size]="10"></app-icon>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-3">
        <div>
          <p class="text-[10px] text-slate-400 uppercase tracking-wider">UHID</p>
          <p class="text-xs font-mono font-semibold text-slate-800 mt-0.5">{{ patient.uhid }}</p>
        </div>
        <div>
          <p class="text-[10px] text-slate-400 uppercase tracking-wider">Patient Name</p>
          <p class="text-xs font-semibold text-slate-800 mt-0.5 truncate">{{ patient.name }}</p>
        </div>
        <div>
          <p class="text-[10px] text-slate-400 uppercase tracking-wider">Surgery Doctor</p>
          <p class="text-xs font-semibold text-slate-800 mt-0.5 truncate">{{ patient.surgeon }}</p>
        </div>
        <div>
          <p class="text-[10px] text-slate-400 uppercase tracking-wider">Anaesthesia Doctor</p>
          <p class="text-xs font-semibold text-slate-800 mt-0.5 truncate">{{ patient.anaesthesiologist || '—' }}</p>
        </div>
        <div class="col-span-2">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider">OT Room · Time</p>
          <p class="text-xs font-semibold text-slate-800 mt-0.5">{{ patient.otRoom }} · {{ patient.scheduledTime }}</p>
        </div>
      </div>

      <button
        type="button"
        (click)="view.emit()"
        class="w-full h-7 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
      >
        {{ viewLabel }}
      </button>
    </div>
  `,
})
export class OTSlotPopupComponent {
  @Input() patient: {
    uhid: string
    name: string
    surgeon: string
    anaesthesiologist?: string
    otRoom: string
    scheduledTime: string
  }
  @Input() pos: { x: number; y: number } = { x: 0, y: 0 }
  @Input() viewLabel: string = "View Patient"
  @Output() close = new EventEmitter<void>()
  @Output() view = new EventEmitter<void>()

  get popupLeft(): number {
    const W = 340
    const winW = typeof window !== "undefined" ? window.innerWidth : 1200
    return Math.min(Math.max(this.pos.x + 10, 8), winW - W - 8)
  }

  get popupTop(): number {
    const H = 200
    const winH = typeof window !== "undefined" ? window.innerHeight : 800
    return this.pos.y + H > winH - 8
      ? Math.max(this.pos.y - H - 10, 8)
      : this.pos.y + 10
  }
}
