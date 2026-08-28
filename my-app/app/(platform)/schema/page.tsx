"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { 
  Search, Download, FolderTree, Database, Code2, 
  Copy, Info, Hash, Network, Terminal, Tag, Check
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CATEGORIES, MOCK_SCHEMA, SchemaCategory, SchemaField } from "./data";

export default function SchemaPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SchemaCategory | "All">("All");
  const [selectedField, setSelectedField] = useState<SchemaField | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredFields = MOCK_SCHEMA.filter(field => {
    const matchesCategory = selectedCategory === "All" || field.category === selectedCategory;
    const matchesSearch = field.name.toLowerCase().includes(search.toLowerCase()) || 
                          field.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case "ip": return "text-[#4ade80] bg-[#22c55e]/10 border-[#22c55e]/30";
      case "keyword": return "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30";
      case "long": return "text-[#eab308] bg-[#eab308]/10 border-[#eab308]/30";
      case "date": return "text-[#8b5cf6] bg-[#8b5cf6]/10 border-[#8b5cf6]/30";
      default: return "text-[#94a3b8] bg-[#1c2433] border-[#243044]";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050709] overflow-hidden">
      
      {/* Global Header & Search */}
      <PageHeader 
        title="Universal Schema Explorer" 
        description="Browse and search the standardized ULPF event taxonomy."
        badge={
          <div className="flex items-center gap-2 bg-[#0a0d12] border border-[#1e2d3d] px-2 py-1 rounded-md">
            <Database className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span className="text-[10px] font-mono text-[#e2e8f0] font-bold">ULPF Schema v1.0</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search fields or descriptions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#1e2d3d] rounded-lg pl-9 pr-4 py-1.5 text-xs text-[#e2e8f0] focus:border-[#3b82f6] outline-none transition-colors placeholder:text-[#64748b]"
              />
            </div>
            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4"/>}>Export JSON Schema</Button>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: Taxonomy Categories */}
        <div className="w-[250px] border-r border-[#1e2d3d] bg-[#0a0d12] flex flex-col flex-shrink-0 z-10 shadow-xl">
           <div className="px-4 py-3 border-b border-[#1e2d3d] bg-[#080b0f] flex items-center gap-2">
             <FolderTree className="w-4 h-4 text-[#64748b]" />
             <h2 className="text-[#e2e8f0] text-sm font-semibold tracking-tight">Categories</h2>
           </div>
           <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <button
                onClick={() => setSelectedCategory("All")}
                className={cn(
                  "w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors flex items-center justify-between",
                  selectedCategory === "All" ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1e2d3d]/50"
                )}
              >
                <span>All Fields</span>
                <span className="text-[10px] font-mono opacity-50">{MOCK_SCHEMA.length}</span>
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors flex items-center justify-between",
                    selectedCategory === cat.name ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1e2d3d]/50"
                  )}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] font-mono opacity-50">{cat.count}</span>
                </button>
              ))}
           </div>
        </div>

        {/* Center Pane: Field Table */}
        <div className="flex-1 flex flex-col bg-[#050709] border-r border-[#1e2d3d]">
           <div className="px-4 py-3 border-b border-[#1e2d3d] bg-[#080b0f] flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Hash className="w-4 h-4 text-[#64748b]" />
               <h2 className="text-[#e2e8f0] text-sm font-semibold tracking-tight">
                 {selectedCategory === "All" ? "All Fields" : `${selectedCategory} Fields`}
               </h2>
             </div>
             <span className="text-[#64748b] text-[10px] font-mono uppercase font-bold tracking-widest">{filteredFields.length} results</span>
           </div>
           
           <div className="flex-1 overflow-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-[#0a0d12] border-b border-[#1e2d3d] sticky top-0 z-10">
                   <th className="px-4 py-2 text-[#64748b] text-[10px] uppercase font-bold tracking-widest w-1/3">Field Name</th>
                   <th className="px-4 py-2 text-[#64748b] text-[10px] uppercase font-bold tracking-widest w-1/6">Type</th>
                   <th className="px-4 py-2 text-[#64748b] text-[10px] uppercase font-bold tracking-widest">Description</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredFields.map(field => (
                   <tr 
                     key={field.id}
                     onClick={() => setSelectedField(field)}
                     className={cn(
                       "border-b border-[#1e2d3d]/50 cursor-pointer transition-colors group",
                       selectedField?.id === field.id ? "bg-[#1c2433]" : "hover:bg-[#0d1117]"
                     )}
                   >
                     <td className="px-4 py-3 font-mono text-xs">
                       <div className="flex items-center gap-2">
                         <span className={selectedField?.id === field.id ? "text-[#e2e8f0] font-bold" : "text-[#94a3b8] group-hover:text-[#e2e8f0]"}>
                           {field.name}
                         </span>
                         {field.required && <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" title="Required" />}
                       </div>
                     </td>
                     <td className="px-4 py-3">
                       <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase", getTypeColor(field.type))}>
                         {field.type}
                       </span>
                     </td>
                     <td className="px-4 py-3 text-xs text-[#64748b] truncate max-w-[200px] group-hover:text-[#94a3b8]">
                       {field.description}
                     </td>
                   </tr>
                 ))}
                 {filteredFields.length === 0 && (
                   <tr>
                     <td colSpan={3} className="px-4 py-8 text-center text-[#64748b] text-sm font-mono italic">
                       No fields match your search.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* Right Pane: Inspector */}
        <div className="w-[450px] bg-[#0a0d12] flex flex-col flex-shrink-0 z-10 shadow-2xl">
          {selectedField ? (
            <>
              <div className="px-6 py-4 border-b border-[#1e2d3d] bg-[#080b0f] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#3b82f6]" />
                  <h2 className="text-[#e2e8f0] text-lg font-mono font-bold tracking-tight">{selectedField.name}</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="xs" 
                  onClick={() => handleCopy(selectedField.name, 'name')}
                >
                  {copiedId === 'name' ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Meta block */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#050709] border border-[#1e2d3d] rounded p-3 text-center">
                    <div className="text-[#64748b] text-[9px] uppercase font-bold tracking-widest mb-1">Type</div>
                    <div className={cn("text-[10px] font-mono font-bold inline-block px-1.5 py-0.5 rounded border uppercase", getTypeColor(selectedField.type))}>
                      {selectedField.type}
                    </div>
                  </div>
                  <div className="bg-[#050709] border border-[#1e2d3d] rounded p-3 text-center">
                    <div className="text-[#64748b] text-[9px] uppercase font-bold tracking-widest mb-1">Requirement</div>
                    <div className={cn("text-[10px] font-mono font-bold inline-block px-1.5 py-0.5 rounded border uppercase", selectedField.required ? "text-[#ef4444] bg-[#7f1d1d]/20 border-[#ef4444]/30" : "text-[#94a3b8] bg-[#1c2433] border-[#243044]")}>
                      {selectedField.required ? "REQUIRED" : "OPTIONAL"}
                    </div>
                  </div>
                  <div className="bg-[#050709] border border-[#1e2d3d] rounded p-3 text-center">
                    <div className="text-[#64748b] text-[9px] uppercase font-bold tracking-widest mb-1">Usage Freq</div>
                    <div className="text-[#e2e8f0] text-[10px] font-mono font-bold mt-1">
                      {selectedField.usageFrequency}%
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 mb-2">
                    <Info className="w-3.5 h-3.5" /> Description
                  </h3>
                  <p className="text-[#e2e8f0] text-sm leading-relaxed">
                    {selectedField.description}
                  </p>
                </div>

                {/* Examples */}
                <div>
                  <h3 className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-widest mb-2">Expected Values / Examples</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedField.examples.map((ex, i) => (
                      <span key={i} className="bg-[#1c2433] border border-[#243044] text-[#a5b4fc] text-xs font-mono px-2 py-1 rounded">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Common Source Mappings */}
                <div>
                  <h3 className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 mb-3">
                    <Network className="w-3.5 h-3.5" /> Common Source Mappings
                  </h3>
                  <div className="bg-[#050709] border border-[#1e2d3d] rounded-lg divide-y divide-[#1e2d3d]">
                    {selectedField.sourceMappings.map((src, i) => (
                      <div key={i} className="px-4 py-2.5 flex items-center justify-between group hover:bg-[#121822] transition-colors">
                        <span className="text-[#94a3b8] text-xs font-mono group-hover:text-[#e2e8f0]">{src}</span>
                        <span className="text-[#3b82f6] text-[10px] font-mono">→ {selectedField.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* JSON Snippet */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5" /> JSON Object Context
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="xs" 
                      className="h-6 px-2"
                      onClick={() => handleCopy(`{\n  "${selectedField.name}": "${selectedField.examples[0]}"\n}`, 'json')}
                    >
                      {copiedId === 'json' ? <Check className="w-3 h-3 text-[#22c55e]" /> : <Copy className="w-3 h-3 text-[#64748b]" />}
                    </Button>
                  </div>
                  <pre className="bg-[#050709] border border-[#1e2d3d] rounded-lg p-4 text-[#e2e8f0] text-xs font-mono overflow-x-auto">
{`{
  // ... other fields
  "${selectedField.name}": ${selectedField.type === 'long' || selectedField.type === 'boolean' ? selectedField.examples[0] : `"${selectedField.examples[0]}"`}
}`}
                  </pre>
                </div>

              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#64748b] gap-4 p-8 text-center">
               <div className="w-16 h-16 rounded-full bg-[#1c2433] flex items-center justify-center border border-[#243044]">
                 <Terminal className="w-6 h-6 text-[#374151]" />
               </div>
               <div>
                 <h3 className="text-[#e2e8f0] text-sm font-semibold mb-1">No Field Selected</h3>
                 <p className="text-xs font-mono leading-relaxed">Select a field from the table to view its schema definition, mappings, and raw examples.</p>
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
