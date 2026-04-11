"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { SIZE_RECOMMENDATIONS, CARE_INSTRUCTIONS, GROWTH_MILESTONES } from "@/lib/sizeGuideData";

export default function SizeGuide({ isOpen, onClose, category = "default" }) {
  const [activeTab, setActiveTab] = useState("sizes"); // sizes, care, growth
  const sizeData = SIZE_RECOMMENDATIONS[category] || SIZE_RECOMMENDATIONS.default;
  const careParts = category === "onesies" ? "organic_cotton" : category === "dresses" ? "cotton_blend" : "default";
  const careData = CARE_INSTRUCTIONS[careParts] || CARE_INSTRUCTIONS.default;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-black/10 p-6 flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold text-black">{sizeData.title}</h2>
              <button
                onClick={onClose}
                className="text-black/50 hover:text-black transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 md:p-8">
              {/* Description */}
              <p className="text-[13px] text-black/70 mb-6">{sizeData.description}</p>

              {/* Tabs */}
              <div className="flex gap-4 mb-8 border-b border-black/10">
                <button
                  onClick={() => setActiveTab("sizes")}
                  className={`pb-3 text-[12px] font-bold tracking-widest uppercase transition-colors ${
                    activeTab === "sizes"
                      ? "text-black border-b-2 border-black"
                      : "text-black/50 hover:text-black"
                  }`}
                >
                  Size Chart
                </button>
                <button
                  onClick={() => setActiveTab("care")}
                  className={`pb-3 text-[12px] font-bold tracking-widest uppercase transition-colors ${
                    activeTab === "care"
                      ? "text-black border-b-2 border-black"
                      : "text-black/50 hover:text-black"
                  }`}
                >
                  Care
                </button>
                <button
                  onClick={() => setActiveTab("growth")}
                  className={`pb-3 text-[12px] font-bold tracking-widest uppercase transition-colors ${
                    activeTab === "growth"
                      ? "text-black border-b-2 border-black"
                      : "text-black/50 hover:text-black"
                  }`}
                >
                  Growth
                </button>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === "sizes" && (
                  <motion.div
                    key="sizes"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Size Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] md:text-[12px] border-collapse">
                        <thead>
                          <tr className="border-b-2 border-black bg-gray-50">
                            <th className="text-left p-3 font-bold tracking-widest uppercase">Age Group</th>
                            <th className="text-left p-3 font-bold tracking-widest uppercase">Shoulder</th>
                            <th className="text-left p-3 font-bold tracking-widest uppercase">Sleeve Length</th>
                            <th className="text-left p-3 font-bold tracking-widest uppercase">Half Chest</th>
                            <th className="text-left p-3 font-bold tracking-widest uppercase">Total Length</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(sizeData.sizes).map(([key, size]) => (
                            <tr key={key} className="border-b border-black/10 hover:bg-gray-50/50 transition-colors">
                              <td className="p-3 font-bold text-black">{size.label}</td>
                              <td className="p-3 text-black/70">{size.shoulder}</td>
                              <td className="p-3 text-black/70">{size.sleeves}</td>
                              <td className="p-3 text-black/70">{size.chest}</td>
                              <td className="p-3 text-black/70">{size.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Tips */}
                    <div className="bg-[#f6f5f3] rounded-lg p-4 md:p-6">
                      <h4 className="text-[13px] font-bold tracking-widest uppercase text-black mb-4">Measurement Tips</h4>
                      <ul className="space-y-2">
                        <li className="text-[12px] text-black/70 flex gap-3">
                          <span className="text-black font-bold">•</span>
                          <span><strong>Shoulder:</strong> Measure from shoulder point to shoulder point across the back</span>
                        </li>
                        <li className="text-[12px] text-black/70 flex gap-3">
                          <span className="text-black font-bold">•</span>
                          <span><strong>Sleeve Length:</strong> Measure from the center back neck, across shoulder, down to wrist</span>
                        </li>
                        <li className="text-[12px] text-black/70 flex gap-3">
                          <span className="text-black font-bold">•</span>
                          <span><strong>Half Chest:</strong> Measure around the chest and divide by 2</span>
                        </li>
                        <li className="text-[12px] text-black/70 flex gap-3">
                          <span className="text-black font-bold">•</span>
                          <span><strong>Total Length:</strong> Measure from the top of the shoulder to the hem</span>
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeTab === "care" && (
                  <motion.div
                    key="care"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="bg-[#f6f5f3] rounded-lg p-4 md:p-6">
                      <h4 className="text-[13px] font-bold tracking-widest uppercase text-black mb-4">{careData.title}</h4>
                      <ul className="space-y-3">
                        {careData.instructions.map((instruction, idx) => (
                          <li key={idx} className="text-[12px] text-black/70 flex gap-3">
                            <span className="text-black font-bold">{idx + 1}.</span>
                            <span>{instruction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Shrinkage Warning */}
                    <div className="bg-[#FFF3CD] border border-[#FFC107] rounded-lg p-4 md:p-6">
                      <h4 className="text-[13px] font-bold tracking-widest uppercase text-[#856404] mb-3">⚠️ Shrinkage Notice</h4>
                      <p className="text-[12px] text-[#856404]">
                        Organic cotton fabrics may shrink 5-10% in the first wash. We recommend sizing up slightly if this is a concern, or washing in cold water to minimize shrinkage.
                      </p>
                    </div>

                    {/* General Tips */}
                    <div className="bg-[#E8F5E9] border border-[#4CAF50] rounded-lg p-4 md:p-6">
                      <h4 className="text-[13px] font-bold tracking-widest uppercase text-[#2E7D32] mb-3">✨ Pro Tips</h4>
                      <ul className="space-y-2">
                        <li className="text-[12px] text-[#2E7D32] flex gap-3">
                          <span>•</span>
                          <span>Wash new items before wearing to remove any finishes</span>
                        </li>
                        <li className="text-[12px] text-[#2E7D32] flex gap-3">
                          <span>•</span>
                          <span>Turn items inside out to preserve colors</span>
                        </li>
                        <li className="text-[12px] text-[#2E7D32] flex gap-3">
                          <span>•</span>
                          <span>Avoid fabric softeners which can damage delicate fabrics</span>
                        </li>
                        <li className="text-[12px] text-[#2E7D32] flex gap-3">
                          <span>•</span>
                          <span>Air dry when possible to extend garment life</span>
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeTab === "growth" && (
                  <motion.div
                    key="growth"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <p className="text-[12px] text-black/70 mb-6">
                      Here's a guide to building a wardrobe as your child grows. These are recommendations based on typical growth patterns.
                    </p>

                    {GROWTH_MILESTONES.map((milestone, idx) => (
                      <div key={idx} className="border border-black/10 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="text-[13px] font-bold text-black">{milestone.age}</h5>
                            <p className="text-[11px] text-black/50">Size: {milestone.size}</p>
                          </div>
                        </div>
                        <p className="text-[12px] text-black/70">{milestone.what}</p>
                      </div>
                    ))}

                    <div className="bg-[#f6f5f3] rounded-lg p-4 md:p-6 mt-6">
                      <h4 className="text-[13px] font-bold tracking-widest uppercase text-black mb-4">Shopping Tips</h4>
                      <ul className="space-y-2">
                        <li className="text-[12px] text-black/70 flex gap-3">
                          <span>•</span>
                          <span>Kids grow fast — buy versatile pieces that work across sizes</span>
                        </li>
                        <li className="text-[12px] text-black/70 flex gap-3">
                          <span>•</span>
                          <span>Invest in quality basics that last through hand-me-downs</span>
                        </li>
                        <li className="text-[12px] text-black/70 flex gap-3">
                          <span>•</span>
                          <span>Mix and match pieces for maximum outfit combinations</span>
                        </li>
                        <li className="text-[12px] text-black/70 flex gap-3">
                          <span>•</span>
                          <span>Plan for seasonal needs (monsoon, summer, winter)</span>
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-black/10 p-4 md:p-6 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-black text-white text-[12px] font-bold tracking-widest uppercase rounded hover:opacity-80 transition-opacity"
              >
                Close
              </button>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
