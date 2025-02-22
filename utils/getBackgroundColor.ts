type Color = "black" | "green" | "blue" | "orange" | "purple" | string;

export default function getBackgroundColor(color: Color): string {
  switch (color) {
    case "black":
      return "bg-gradient-to-br from-gray-800 to-gray-900";
    case "green":
      return "bg-gradient-to-br from-green-500 to-green-800";
    case "blue":
      return "bg-gradient-to-br from-blue-500 to-blue-800";
    case "orange":
      return "bg-gradient-to-br from-orange-400 to-orange-600";
    case "purple":
      return "bg-gradient-to-br from-purple-500 to-purple-800";
    default:
      return "";
  }
}
