import { HassEntity } from "home-assistant-js-websocket";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  query,
  TemplateResult,
} from "lit-element";
import { classMap } from "lit-html/directives/class-map";
import type { HaDateInput } from "../../../components/ha-date-input";
import "../../../components/ha-relative-time";
import "../../../components/paper-time-input";
import type { PaperTimeInput } from "../../../components/paper-time-input";
import { UNAVAILABLE_STATES, UNKNOWN } from "../../../data/entity";
import { setInputDateTimeValue } from "../../../data/input_datetime";
import type { HomeAssistant } from "../../../types";

@customElement("more-info-input_datetime")
class DatetimeInput extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public stateObj?: HassEntity;

  @query("paper-time-input") private _timeInputEl?: PaperTimeInput;

  @query("ha-date-input") private _dateInputEl?: HaDateInput;

  protected render(): TemplateResult {
    if (!this.hass || !this.stateObj) {
      return html``;
    }

    return html`
      <div
        class="more-info-input_datetime ${classMap({
          "has-has_time": "has_time" in this.stateObj.attributes,
          "has-has_date": "has_date" in this.stateObj.attributes,
        })}"
      >
        ${this.stateObj.attributes.has_date
          ? html`
              <div>
                <ha-date-input
                  .label="${this.hass.localize(
                    "ui.dialogs.helper_settings.input_datetime.date"
                  )}"
                  .disabled=${UNAVAILABLE_STATES.includes(this.stateObj.state)}
                  .value=${`${this.stateObj.attributes.year}-${this.stateObj.attributes.month}-${this.stateObj.attributes.day}`}
                  @change=${this._selectedValueChanged}
                  @click=${this._stopEventPropagation}
                ></ha-date-input>
              </div>
            `
          : ""}
        ${this.stateObj.attributes.has_time
          ? html`
              <div class="single-row">
                <paper-time-input
                  .label="${this.hass.localize(
                    "ui.dialogs.helper_settings.input_datetime.time"
                  )}"
                  .disabled=${UNAVAILABLE_STATES.includes(this.stateObj.state)}
                  .hour=${this.stateObj.state === UNKNOWN
                    ? ""
                    : this.stateObj.attributes.hour.toString().padStart(2, "0")}
                  .min=${this.stateObj.state === UNKNOWN
                    ? ""
                    : this.stateObj.attributes.minute
                        .toString()
                        .padStart(2, "0")}
                  @change=${this._selectedValueChanged}
                  @click=${this._stopEventPropagation}
                  format="24"
                ></paper-time-input>
              </div>
            `
          : ""}
      </div>
    `;
  }

  private _stopEventPropagation(ev: Event): void {
    ev.stopPropagation();
  }

  private _selectedValueChanged(ev): void {
    if (!this.stateObj) {
      return;
    }

    const time = this._timeInputEl
      ? this._timeInputEl.value?.trim()
      : undefined;

    const date = this._dateInputEl ? this._dateInputEl.value : undefined;

    if (time !== this.stateObj.state) {
      setInputDateTimeValue(this.hass!, this.stateObj.entity_id, time, date);
    }

    ev.target.blur();
  }

  static get styles(): CSSResult {
    return css`
      .single-row {
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "more-info-input_datetime": DatetimeInput;
  }
}
