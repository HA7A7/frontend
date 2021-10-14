/* eslint-disable lit/no-template-arrow */
import "@material/mwc-button";
import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators";
import { mockAreaRegistry } from "../../../demo/src/stubs/area_registry";
import { mockDeviceRegistry } from "../../../demo/src/stubs/device_registry";
import { mockEntityRegistry } from "../../../demo/src/stubs/entity_registry";
import { mockHassioSupervisor } from "../../../demo/src/stubs/hassio_supervisor";
import "../../../src/components/ha-selector/ha-selector";
import "../../../src/components/ha-settings-row";
import { BlueprintInput } from "../../../src/data/blueprint";
import { provideHass } from "../../../src/fake_data/provide_hass";
import type { HomeAssistant } from "../../../src/types";
import "../components/demo-black-white-row";

const SCHEMAS: {
  name: string;
  input: Record<string, BlueprintInput | null>;
}[] = [
  {
    name: "One of each",
    input: {
      entity: { name: "Entity", selector: { entity: {} } },
      device: { name: "Device", selector: { device: {} } },
      addon: { name: "Addon", selector: { addon: {} } },
      area: { name: "Area", selector: { area: {} } },
      target: { name: "Target", selector: { target: {} } },
      number_box: {
        name: "Number Box",
        selector: {
          number: {
            min: 0,
            max: 10,
            mode: "box",
          },
        },
      },
      number_slider: {
        name: "Number Slider",
        selector: {
          number: {
            min: 0,
            max: 10,
            mode: "slider",
          },
        },
      },
      boolean: { name: "Boolean", selector: { boolean: {} } },
      time: { name: "Time", selector: { time: {} } },
      action: { name: "Action", selector: { action: {} } },
      text: { name: "Text", selector: { text: { multiline: false } } },
      text_multiline: {
        name: "Text multiline",
        selector: { text: { multiline: true } },
      },
      object: { name: "Object", selector: { object: {} } },
      select: {
        name: "Select",
        selector: { select: { options: ["Option 1", "Option 2"] } },
      },
    },
  },
];

@customElement("demo-ha-selector")
class DemoHaSelector extends LitElement {
  @state() private hass!: HomeAssistant;

  private data = SCHEMAS.map(() => ({}));

  constructor() {
    super();
    const hass = provideHass(this);
    hass.updateTranslations(null, "en");
    hass.updateTranslations("config", "en");
    mockEntityRegistry(hass);
    mockDeviceRegistry(hass);
    mockAreaRegistry(hass);
    mockHassioSupervisor(hass);
  }

  protected render(): TemplateResult {
    return html`
      ${SCHEMAS.map((info, idx) => {
        const data = this.data[idx];
        const valueChanged = (ev) => {
          this.data[idx] = {
            ...data,
            [ev.target.key]: ev.detail.value,
          };
          this.requestUpdate();
        };
        return html`
          <demo-black-white-row .value=${this.data[idx]}>
            ${["light", "dark"].map(
              (slot) => html`
                <ha-card .slot=${slot} .header=${info.name}>
                  <div class="card-content">
                    ${Object.entries(info.input).map(
                      ([key, value]) => html`
                        <ha-settings-row narrow slot=${slot}>
                          <span slot="heading">${value?.name || key}</span>
                          ${value?.description
                            ? html`<span slot="description"
                                >${value?.description}</span
                              >`
                            : ""}
                          <ha-selector
                            .hass=${this.hass}
                            .selector=${value!.selector}
                            .key=${key}
                            .value=${data[key] ?? value!.default}
                            @value-changed=${valueChanged}
                          ></ha-selector>
                        </ha-settings-row>
                      `
                    )}
                  </div>
                </ha-card>
              `
            )}
          </demo-black-white-row>
        `;
      })}
    `;
  }

  static styles = css`
    ha-card {
      width: 400px;
    }
    paper-input,
    ha-selector {
      width: 60;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "demo-ha-selector": DemoHaSelector;
  }
}
