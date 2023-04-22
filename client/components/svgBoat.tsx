import { divIcon } from "leaflet";
// allow us to write more concise code for SVG paths
const [M, L] = "ML";

// NOT a react component
export const svgBoat = ({
  loa = 21,
  width = loa / 3,
  heading,
  cog,
  zoom,
}: {
  loa?: number;
  width?: number;
  heading?: number;
  cog?: number;
  zoom: number;
}) => {
  let svg = "";

  /* eslint-disable no-param-reassign -- temp hack */
  if (zoom < 11) {
    loa /= zoom / 4;
    width /= zoom / 4;
  } else if (zoom < 13) {
    loa /= zoom / 8;
    width /= zoom / 8;
  }
  /* eslint-enable no-param-reassign */

  const angleToUse = heading || cog;
  if (angleToUse) {
    const isDrifting = cog && heading && cog !== heading;

    const path = [
      [M, 0, 0],
      [L, loa * 0.1, width / 2],
      [L, 0, width],
      [L, loa * 0.6, width],
      [L, loa, width / 2],
      [L, loa * 0.6, 0],
    ]
      .flat()
      .join(" ");

    const arrowWidth = 0.75;
    const arrowPath = [
      [M, 0, width / 2 - arrowWidth],
      [L, loa + 5, width / 2 - arrowWidth],
      [L, loa + 5, width / 2 - arrowWidth * 5],
      [L, loa + 5 + arrowWidth * 5, width / 2],
      [L, loa + 5 + arrowWidth * 5, width / 2],
      [L, loa + 5, width / 2 + arrowWidth * 5],
      [L, loa + 5, width / 2 + arrowWidth],
      [L, 0, width / 2 + arrowWidth],
      [L, 0, width / 2 - arrowWidth],
    ]
      .flat()
      .join(" ");
    svg += `
      <path
        fill="red"
        d="${path}"
        style="transform: rotate(${angleToUse - 90}deg)"
      />
    `;
    if (isDrifting) {
      svg += `
        <path
          fill="red"
          d="${arrowPath}"
          style="transform: rotate(${cog - 90}deg)"
        />
      `;
    }
  } else {
    // if we don't have a heading, we can't render the boat shape.
    // so just render a circle.
    svg = `<circle fill="red" r="${width / 2}" />`;
  }

  const [svgWidth, svgHeight] = [60, 60];

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
      <g style="transform:translate(${svgWidth / 2}px, ${svgHeight / 2}px)">
        ${svg}
      </g>
  </svg>`,
    className: "boat-icon",
    iconSize: [svgWidth, svgHeight],
    iconAnchor: [svgWidth / 2, svgHeight / 2],
  });
};
