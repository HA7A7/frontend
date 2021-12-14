import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, query } from "lit/decorators";
import { fireEvent } from "../common/dom/fire_event";
import { conditionalClamp } from "../common/number/clamp";
import { HomeAssistant } from "../types";
import "./ha-icon";
import "./ha-icon-button";

@customElement("ha-climate-control")
class HaClimateControl extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() public value!: number;

  @property() public unit = "";

  @property() public min?: number;

  @property() public max?: number;

  @property() public step = 1;

  private lastChanged?: number;

  @query("#target_temperature") private _targetTemperature!: HTMLElement;

  protected render(): TemplateResult {
    return html`
      <div id="target_temperature">${this.value} ${this.unit}</div>
      <div class="control-buttons">
        <div>
          <ha-icon-button
            .path=${mdiChevronUp}
            .label=${this.hass.localize(
              "ui.components.climate-control.temperature_up"
            )}
            @click=${this.incrementValue}
          >
          </ha-icon-button>
        </div>
        <div>
          <ha-icon-button
            .path=${mdiChevronDown}
            .label=${this.hass.localize(
              "ui.components.climate-control.temperature_down"
            )}
            @click=${this.decrementValue}
          >
          </ha-icon-button>
        </div>
      </div>
    `;
  }

  protected updated(changedProperties) {
    if (changedProperties.has("value")) {
      this.valueChanged();
    }
  }

  private temperatureStateInFlux(inFlux) {
    this._targetTemperature.classList.toggle("in-flux", inFlux);
  }

  private round(value) {
    // Round value to precision derived from step.
    // Inspired by https://github.com/soundar24/roundSlider/blob/master/src/roundslider.js
    const s = this.step.toString().split(".");
    return s[1] ? parseFloat(value.toFixed(s[1].length)) : Math.round(value);
  }

  private incrementValue() {
    const newValue = this.round(this.value + this.step);
    this.processNewValue(newValue);
  }

  private decrementValue() {
    const newValue = this.round(this.value - this.step);
    this.processNewValue(newValue);
  }

  private processNewValue(value) {
    const newValue = conditionalClamp(value, this.min, this.max);

    if (this.value !== newValue) {
      this.value = newValue;
      this.lastChanged = Date.now();
      this.temperatureStateInFlux(true);
    }
  }

  private valueChanged() {
    // When the last_changed timestamp is changed,
    // trigger a potential event fire in the future,
    // as long as last_changed is far enough in the past.
    if (this.lastChanged) {
      window.setTimeout(() => {
        const now = Date.now();
        if (now - this.lastChanged! >= 2000) {
          fireEvent(this, "change");
          this.temperatureStateInFlux(false);
          this.lastChanged = undefined;
        }
      }, 2010);
    }
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: flex;
        justify-content: space-between;
      }
      .in-flux#target_temperature {
        color: var(--error-color);
      }
      #target_temperature {
        align-self: center;
        font-size: 200%;
        direction: ltr;
      }
      .control-buttons {
        font-size: 200%;
        text-align: right;
      }
      ha-icon-button {
        --mdc-icon-size: 32px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-climate-control": HaClimateControl;
  }
}
