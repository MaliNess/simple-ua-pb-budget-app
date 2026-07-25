(() => {
  "use strict";

  const textDecoder = new TextDecoder("utf-8");
  const ZIP_LOCAL_FILE = 0x04034b50;
  const ZIP_CENTRAL_FILE = 0x02014b50;
  const ZIP_END = 0x06054b50;
  const MAX_EOCD_SEARCH = 0xffff + 22;
  const MAX_PART_SIZE = 100 * 1024 * 1024;

  function readUint16(view, offset) {
    return view.getUint16(offset, true);
  }

  function readUint32(view, offset) {
    return view.getUint32(offset, true);
  }

  function assertRange(length, offset, size, message) {
    if (!Number.isInteger(offset) || !Number.isInteger(size) || offset < 0 || size < 0 || offset + size > length) {
      throw new Error(message || "The XLSX file is truncated or malformed.");
    }
  }

  function findEndOfCentralDirectory(bytes, view) {
    if (bytes.length < 22) throw new Error("This file is not a valid XLSX ZIP archive.");
    const minimum = Math.max(0, bytes.length - MAX_EOCD_SEARCH);
    for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) {
      if (readUint32(view, offset) === ZIP_END) return offset;
    }
    throw new Error("This file is not a valid XLSX ZIP archive.");
  }

  function decodeZipName(bytes) {
    return textDecoder.decode(bytes).replace(/\\/g, "/");
  }

  function normalizePath(path) {
    const parts = [];
    String(path || "").replace(/\\/g, "/").split("/").forEach(part => {
      if (!part || part === ".") return;
      if (part === "..") parts.pop();
      else parts.push(part);
    });
    return parts.join("/");
  }

  function resolvePartPath(basePart, target) {
    const value = String(target || "");
    if (value.startsWith("/")) return normalizePath(value.slice(1));
    const slash = basePart.lastIndexOf("/");
    const directory = slash >= 0 ? basePart.slice(0, slash + 1) : "";
    return normalizePath(directory + value);
  }

  class ZipArchive {
    constructor(arrayBuffer) {
      this.bytes = new Uint8Array(arrayBuffer);
      this.view = new DataView(arrayBuffer);
      this.entries = new Map();
      this.readCentralDirectory();
    }

    readCentralDirectory() {
      const endOffset = findEndOfCentralDirectory(this.bytes, this.view);
      assertRange(this.bytes.length, endOffset, 22);

      const diskNumber = readUint16(this.view, endOffset + 4);
      const centralDisk = readUint16(this.view, endOffset + 6);
      const entriesOnDisk = readUint16(this.view, endOffset + 8);
      const totalEntries = readUint16(this.view, endOffset + 10);
      const centralSize = readUint32(this.view, endOffset + 12);
      const centralOffset = readUint32(this.view, endOffset + 16);

      if (diskNumber !== 0 || centralDisk !== 0 || entriesOnDisk !== totalEntries) {
        throw new Error("Multi-part XLSX archives are not supported.");
      }
      if (totalEntries === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
        throw new Error("ZIP64 XLSX files are not supported by the limited importer.");
      }
      assertRange(this.bytes.length, centralOffset, centralSize, "The XLSX central directory is invalid.");

      let offset = centralOffset;
      for (let index = 0; index < totalEntries; index += 1) {
        assertRange(this.bytes.length, offset, 46, "The XLSX central directory is truncated.");
        if (readUint32(this.view, offset) !== ZIP_CENTRAL_FILE) {
          throw new Error("The XLSX central directory contains an invalid entry.");
        }

        const flags = readUint16(this.view, offset + 8);
        const method = readUint16(this.view, offset + 10);
        const compressedSize = readUint32(this.view, offset + 20);
        const uncompressedSize = readUint32(this.view, offset + 24);
        const nameLength = readUint16(this.view, offset + 28);
        const extraLength = readUint16(this.view, offset + 30);
        const commentLength = readUint16(this.view, offset + 32);
        const localOffset = readUint32(this.view, offset + 42);
        const totalLength = 46 + nameLength + extraLength + commentLength;
        assertRange(this.bytes.length, offset, totalLength, "The XLSX central directory entry is truncated.");

        if (flags & 0x0001) throw new Error("Password-protected XLSX files are not supported.");
        if (uncompressedSize > MAX_PART_SIZE) throw new Error("An XLSX worksheet part is too large for the limited importer.");
        const name = normalizePath(decodeZipName(this.bytes.subarray(offset + 46, offset + 46 + nameLength)));
        this.entries.set(name, { name, method, compressedSize, uncompressedSize, localOffset });
        offset += totalLength;
      }
    }

    has(name) {
      return this.entries.has(normalizePath(name));
    }

    async read(name) {
      const normalized = normalizePath(name);
      const entry = this.entries.get(normalized);
      if (!entry) throw new Error(`Required XLSX part is missing: ${normalized}`);

      const offset = entry.localOffset;
      assertRange(this.bytes.length, offset, 30, `The XLSX part ${normalized} is truncated.`);
      if (readUint32(this.view, offset) !== ZIP_LOCAL_FILE) {
        throw new Error(`The XLSX part ${normalized} has an invalid local header.`);
      }
      const nameLength = readUint16(this.view, offset + 26);
      const extraLength = readUint16(this.view, offset + 28);
      const dataOffset = offset + 30 + nameLength + extraLength;
      assertRange(this.bytes.length, dataOffset, entry.compressedSize, `The XLSX part ${normalized} is truncated.`);
      const compressed = this.bytes.slice(dataOffset, dataOffset + entry.compressedSize);

      if (entry.method === 0) return compressed;
      if (entry.method !== 8) throw new Error(`Unsupported XLSX compression method ${entry.method}.`);
      if (typeof DecompressionStream === "undefined") {
        throw new Error("This browser does not support the native decompression needed to read XLSX files.");
      }

      let stream;
      try {
        stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      } catch (_) {
        throw new Error("This browser cannot decompress XLSX worksheet data.");
      }
      const result = new Uint8Array(await new Response(stream).arrayBuffer());
      if (entry.uncompressedSize && result.length !== entry.uncompressedSize) {
        throw new Error(`The XLSX part ${normalized} could not be decompressed correctly.`);
      }
      return result;
    }

    async readText(name) {
      return textDecoder.decode(await this.read(name));
    }
  }

  function decodeXmlEntities(value) {
    return String(value || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
      .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  }

  function parseAttributes(source) {
    const attributes = {};
    const pattern = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    for (const match of String(source || "").matchAll(pattern)) {
      attributes[match[1]] = decodeXmlEntities(match[2] ?? match[3] ?? "");
    }
    return attributes;
  }

  function firstTagAttributes(xml, localName) {
    const pattern = new RegExp(`<(?:[\\w.-]+:)?${localName}\\b([^>]*)>`, "i");
    const match = String(xml || "").match(pattern);
    return match ? parseAttributes(match[1]) : null;
  }

  function firstElementBody(xml, localName) {
    const pattern = new RegExp(`<(?:[\\w.-]+:)?${localName}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${localName}>`, "i");
    const match = String(xml || "").match(pattern);
    return match ? match[1] : null;
  }

  function extractTextNodes(xml) {
    const result = [];
    const pattern = /<(?:[\w.-]+:)?t\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?t>/gi;
    for (const match of String(xml || "").matchAll(pattern)) result.push(decodeXmlEntities(match[1]));
    return result.join("");
  }

  function parseRelationships(xml) {
    const relationships = new Map();
    const pattern = /<(?:[\w.-]+:)?Relationship\b([^>]*)\/?\s*>/gi;
    for (const match of String(xml || "").matchAll(pattern)) {
      const attributes = parseAttributes(match[1]);
      const id = attributes.Id || attributes.id;
      if (!id) continue;
      relationships.set(id, {
        target: attributes.Target || "",
        type: attributes.Type || ""
      });
    }
    return relationships;
  }

  function parseSharedStrings(xml) {
    const strings = [];
    const pattern = /<(?:[\w.-]+:)?si\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?si>/gi;
    for (const match of String(xml || "").matchAll(pattern)) strings.push(extractTextNodes(match[1]));
    return strings;
  }

  function columnIndexFromReference(reference) {
    const match = String(reference || "").match(/^([A-Za-z]+)/);
    if (!match) return null;
    let index = 0;
    for (const character of match[1].toUpperCase()) index = index * 26 + character.charCodeAt(0) - 64;
    return index - 1;
  }

  function parseCellValue(cellXml, attributes, sharedStrings) {
    const type = attributes.t || "n";
    if (type === "inlineStr") return extractTextNodes(firstElementBody(cellXml, "is") || cellXml);
    const valueBody = firstElementBody(cellXml, "v");
    const raw = valueBody === null ? "" : decodeXmlEntities(valueBody).trim();

    if (type === "s") {
      const index = Number(raw);
      return Number.isInteger(index) && index >= 0 && index < sharedStrings.length ? sharedStrings[index] : "";
    }
    if (type === "str" || type === "d") return raw;
    if (type === "b") return raw === "1";
    if (type === "e") return "";
    if (raw === "") return "";
    const number = Number(raw);
    return Number.isFinite(number) ? number : raw;
  }

  function excelSerialToDate(serial, date1904) {
    if (!Number.isFinite(serial)) return null;
    const epoch = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
    const utcDate = new Date(epoch + Math.round(serial * 86400000));
    if (Number.isNaN(utcDate.getTime())) return null;
    return new Date(
      utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(),
      utcDate.getUTCHours(), utcDate.getUTCMinutes(), utcDate.getUTCSeconds(), utcDate.getUTCMilliseconds()
    );
  }

  function parseWorksheet(xml, sharedStrings, options = {}) {
    const maxColumns = Number.isInteger(options.maxColumns) ? options.maxColumns : 10;
    const date1904 = Boolean(options.date1904);
    const rows = [];
    const rowPattern = /<(?:[\w.-]+:)?row\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?row>/gi;
    let inferredRowIndex = 0;

    for (const rowMatch of String(xml || "").matchAll(rowPattern)) {
      const rowAttributes = parseAttributes(rowMatch[1]);
      const rowNumber = Number(rowAttributes.r);
      const rowIndex = Number.isInteger(rowNumber) && rowNumber > 0 ? rowNumber - 1 : inferredRowIndex;
      inferredRowIndex = rowIndex + 1;
      const row = [];
      let inferredColumnIndex = 0;
      const cellPattern = /<(?:[\w.-]+:)?c\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/(?:[\w.-]+:)?c>)/gi;

      for (const cellMatch of rowMatch[2].matchAll(cellPattern)) {
        const attributes = parseAttributes(cellMatch[1]);
        const referencedColumn = columnIndexFromReference(attributes.r || "");
        const columnIndex = referencedColumn === null ? inferredColumnIndex : referencedColumn;
        inferredColumnIndex = columnIndex + 1;
        if (columnIndex < 0 || columnIndex >= maxColumns) continue;

        let value = parseCellValue(cellMatch[2] || "", attributes, sharedStrings);
        if (columnIndex === 0 && typeof value === "number" && value > 1) value = excelSerialToDate(value, date1904) || value;
        row[columnIndex] = value;
      }

      while (row.length && (row[row.length - 1] === undefined || row[row.length - 1] === "")) row.pop();
      rows[rowIndex] = row;
    }

    for (let index = 0; index < rows.length; index += 1) if (!Array.isArray(rows[index])) rows[index] = [];
    return rows;
  }

  async function parse(arrayBuffer, options = {}) {
    if (!(arrayBuffer instanceof ArrayBuffer)) throw new Error("Expected XLSX data as an ArrayBuffer.");
    const archive = new ZipArchive(arrayBuffer);
    const workbookPart = "xl/workbook.xml";
    const workbookRelsPart = "xl/_rels/workbook.xml.rels";
    const workbookXml = await archive.readText(workbookPart);
    const relationships = parseRelationships(await archive.readText(workbookRelsPart));

    const sheetAttributes = firstTagAttributes(workbookXml, "sheet");
    if (!sheetAttributes) throw new Error("Workbook has no worksheets.");
    const relationshipKey = Object.keys(sheetAttributes).find(key => key === "r:id" || key.endsWith(":id"));
    const sheetRelationship = relationships.get(relationshipKey ? sheetAttributes[relationshipKey] : "");
    if (!sheetRelationship) throw new Error("The first worksheet relationship is missing.");
    const worksheetPart = resolvePartPath(workbookPart, sheetRelationship.target);

    const workbookProperties = firstTagAttributes(workbookXml, "workbookPr") || {};
    const date1904 = workbookProperties.date1904 === "1" || workbookProperties.date1904 === "true";

    let sharedStrings = [];
    const sharedRelationship = [...relationships.values()].find(item => /\/sharedStrings$/i.test(item.type));
    const sharedStringsPart = sharedRelationship ? resolvePartPath(workbookPart, sharedRelationship.target) : "xl/sharedStrings.xml";
    if (archive.has(sharedStringsPart)) sharedStrings = parseSharedStrings(await archive.readText(sharedStringsPart));

    return parseWorksheet(await archive.readText(worksheetPart), sharedStrings, {
      maxColumns: options.maxColumns ?? 10,
      date1904
    });
  }

  const api = Object.freeze({ parse });
  if (typeof window !== "undefined") window.BudgetXlsx = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
