import "@material/mwc-button/mwc-button";
import { mdiChevronLeft, mdiChevronRight } from "@mdi/js";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInDays,
  endOfDay,
  endOfMonth,
  endOfToday,
  endOfWeek,
  endOfYear,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfToday,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { UnsubscribeFunc } from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import {
  formatDate,
  formatDateMonthYear,
  formatDateShort,
  formatDateYear,
} from "../../../common/datetime/format_date";
import { toggleAttribute } from "../../../common/dom/toggle_attribute";
import "../../../components/ha-button-toggle-group";
import "../../../components/ha-icon-button";
import { EnergyData, getEnergyDataCollection } from "../../../data/energy";
import { SubscribeMixin } from "../../../mixins/subscribe-mixin";
import { HomeAssistant, ToggleButton } from "../../../types";

@customElement("hui-energy-period-selector")
export class HuiEnergyPeriodSelector extends SubscribeMixin(LitElement) {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() public collectionKey?: string;

  @state() _startDate?: Date;

  @state() _endDate?: Date;

  @state() private _period?: "day" | "week" | "month" | "year";

  public connectedCallback() {
    super.connectedCallback();
    toggleAttribute(this, "narrow", this.offsetWidth < 600);
  }

  public hassSubscribe(): UnsubscribeFunc[] {
    return [
      getEnergyDataCollection(this.hass, {
        key: this.collectionKey,
      }).subscribe((data) => this._updateDates(data)),
    ];
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._startDate) {
      return html``;
    }

    const viewButtons: ToggleButton[] = [
      {
        label: this.hass.localize(
          "ui.panel.lovelace.components.energy_period_selector.day"
        ),
        value: "day",
      },
      {
        label: this.hass.localize(
          "ui.panel.lovelace.components.energy_period_selector.week"
        ),
        value: "week",
      },
      {
        label: this.hass.localize(
          "ui.panel.lovelace.components.energy_period_selector.month"
        ),
        value: "month",
      },
      {
        label: this.hass.localize(
          "ui.panel.lovelace.components.energy_period_selector.year"
        ),
        value: "year",
      },
    ];

    return html`
      <div class="row">
        <div class="label">
          ${this._period === "day"
            ? formatDate(this._startDate, this.hass.locale)
            : this._period === "month"
            ? formatDateMonthYear(this._startDate, this.hass.locale)
            : this._period === "year"
            ? formatDateYear(this._startDate, this.hass.locale)
            : `${formatDateShort(
                this._startDate,
                this.hass.locale
              )} - ${formatDateShort(
                this._endDate || new Date(),
                this.hass.locale
              )}`}
          <ha-icon-button
            .label=${this.hass.localize(
              "ui.panel.lovelace.components.energy_period_selector.previous"
            )}
            @click=${this._pickPrevious}
            .path=${mdiChevronLeft}
          ></ha-icon-button>
          <ha-icon-button
            .label=${this.hass.localize(
              "ui.panel.lovelace.components.energy_period_selector.next"
            )}
            @click=${this._pickNext}
            .path=${mdiChevronRight}
          ></ha-icon-button>
          <mwc-button dense outlined @click=${this._pickToday}>
            ${this.hass.localize(
              "ui.panel.lovelace.components.energy_period_selector.today"
            )}
          </mwc-button>
        </div>
        <div class="period">
          <ha-button-toggle-group
            .buttons=${viewButtons}
            .active=${this._period}
            dense
            @value-changed=${this._handleView}
          ></ha-button-toggle-group>
        </div>
      </div>
    `;
  }

  private _handleView(ev: CustomEvent): void {
    this._period = ev.detail.value;
    const today = startOfToday();
    const start =
      !this._startDate ||
      isWithinInterval(today, {
        start: this._startDate,
        end: this._endDate || endOfToday(),
      })
        ? today
        : this._startDate;

    this._setDate(
      this._period === "day"
        ? startOfDay(start)
        : this._period === "week"
        ? startOfWeek(start, { weekStartsOn: 1 })
        : this._period === "month"
        ? startOfMonth(start)
        : startOfYear(start)
    );
  }

  private _pickToday() {
    this._setDate(
      this._period === "day"
        ? startOfToday()
        : this._period === "week"
        ? startOfWeek(new Date(), { weekStartsOn: 1 })
        : this._period === "month"
        ? startOfMonth(new Date())
        : startOfYear(new Date())
    );
  }

  private _pickPrevious() {
    const newStart =
      this._period === "day"
        ? addDays(this._startDate!, -1)
        : this._period === "week"
        ? addWeeks(this._startDate!, -1)
        : this._period === "month"
        ? addMonths(this._startDate!, -1)
        : addYears(this._startDate!, -1);
    this._setDate(newStart);
  }

  private _pickNext() {
    const newStart =
      this._period === "day"
        ? addDays(this._startDate!, 1)
        : this._period === "week"
        ? addWeeks(this._startDate!, 1)
        : this._period === "month"
        ? addMonths(this._startDate!, 1)
        : addYears(this._startDate!, 1);
    this._setDate(newStart);
  }

  private _setDate(startDate: Date) {
    const endDate =
      this._period === "day"
        ? endOfDay(startDate)
        : this._period === "week"
        ? endOfWeek(startDate, { weekStartsOn: 1 })
        : this._period === "month"
        ? endOfMonth(startDate)
        : endOfYear(startDate);

    const energyCollection = getEnergyDataCollection(this.hass, {
      key: this.collectionKey,
    });
    energyCollection.setPeriod(startDate, endDate);
    energyCollection.refresh();
  }

  private _updateDates(energyData: EnergyData): void {
    this._startDate = energyData.start;
    this._endDate = energyData.end || endOfToday();
    const dayDifference = differenceInDays(this._endDate, this._startDate);
    this._period =
      dayDifference < 1
        ? "day"
        : dayDifference === 6
        ? "week"
        : dayDifference > 26 && dayDifference < 31 // 28, 29, 30 or 31 days in a month
        ? "month"
        : dayDifference === 364 || dayDifference === 365 // Leap year
        ? "year"
        : undefined;
  }

  static get styles(): CSSResultGroup {
    return css`
      .row {
        display: flex;
        justify-content: flex-end;
      }
      :host([narrow]) .row {
        flex-direction: column-reverse;
      }
      :host([narrow]) .period {
        margin-bottom: 8px;
      }
      .label {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        font-size: 20px;
      }
      .period {
        display: flex;
        justify-content: flex-end;
      }
      :host {
        --mdc-button-outline-color: currentColor;
        --primary-color: currentColor;
        --mdc-theme-primary: currentColor;
        --mdc-button-disabled-outline-color: var(--disabled-text-color);
        --mdc-button-disabled-ink-color: var(--disabled-text-color);
        --mdc-icon-button-ripple-opacity: 0.2;
      }
      ha-icon-button {
        --mdc-icon-button-size: 28px;
      }
      ha-button-toggle-group {
        padding-left: 8px;
      }
      mwc-button {
        flex-shrink: 0;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-energy-period-selector": HuiEnergyPeriodSelector;
  }
}
