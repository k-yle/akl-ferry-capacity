import { divIcon } from "leaflet";
// allow us to write more concise code for SVG paths
const [M, L] = "ML";

// NOT a react component
export const svgBoat = ({
  loa = 21,
  beam = loa / 3,
  heading,
  cog,
  zoom,
}: {
  loa?: number;
  beam?: number;
  heading?: number;
  cog?: number;
  zoom: number;
}) => {
  let svg = "";

  /* eslint-disable no-param-reassign -- temp hack */
  if (zoom < 11) {
    loa /= zoom / 4;
    beam /= zoom / 4;
  } else if (zoom < 13) {
    loa /= zoom / 8;
    beam /= zoom / 8;
  }
  /* eslint-enable no-param-reassign */

  const angleToUse = heading || cog;
  if (angleToUse) {
    const isDrifting = cog && heading && cog !== heading;

    const path = [
      [M, 0, 0],
      [L, loa * 0.1, beam / 2],
      [L, 0, beam],
      [L, loa * 0.6, beam],
      [L, loa, beam / 2],
      [L, loa * 0.6, 0],
    ]
      .flat()
      .join(" ");

    const arrowWidth = 0.75;
    const arrowPath = [
      [M, 0, beam / 2 - arrowWidth],
      [L, loa + 5, beam / 2 - arrowWidth],
      [L, loa + 5, beam / 2 - arrowWidth * 5],
      [L, loa + 5 + arrowWidth * 5, beam / 2],
      [L, loa + 5 + arrowWidth * 5, beam / 2],
      [L, loa + 5, beam / 2 + arrowWidth * 5],
      [L, loa + 5, beam / 2 + arrowWidth],
      [L, 0, beam / 2 + arrowWidth],
      [L, 0, beam / 2 - arrowWidth],
    ]
      .flat()
      .join(" ");
    svg += `
      <path
        fill="red"
        d="${path}"
        style="transform: rotate(${
          angleToUse - 90
        }deg); transform-box: fill-box; transform-origin: center;"
      />
    `;
    if (isDrifting) {
      svg += `
        <path
          fill="red"
          d="${arrowPath}"
          style="transform: translate(${loa / 2}px, 0) rotate(${
            cog - 90
          }deg); transform-box: fill-box; transform-origin: left;"
        />
      `;
    }
  } else {
    // if we don't have a heading, we can't render the boat shape.
    // so just render a circle.
    svg = `<circle fill="red" r="${beam / 2}" />`;
  }

  const [svgWidth, svgHeight] = [60, 60];

  const trueCentre = {
    x: svgWidth / 2 - (angleToUse ? loa / 2 : 0),
    y: svgHeight / 2 - (angleToUse ? beam / 2 : 0),
  };

  return divIcon({
    html: `
    <svg
      data-loa=${loa}
      width="${svgWidth}"
      height="${svgHeight}"
      style="overflow:visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      >
      <g style="transform:translate(${trueCentre.x}px, ${trueCentre.y}px)">
        ${svg}
      </g>
  </svg>`,
    className: "boat-icon",
    iconSize: [svgWidth, svgHeight],
    iconAnchor: [svgWidth / 2, svgHeight / 2],
  });
};
