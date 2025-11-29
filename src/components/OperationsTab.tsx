import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

type Operation = {
  id: string;
  action: string;
  entity: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
};

export function OperationsTab() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [expandedOps, setExpandedOps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      const { operations } = await apiRequest('/operations');
      setOperations(operations);
    } catch (error) {
      console.error('Error fetching operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedOps);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedOps(newExpanded);
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return 'لا يوجد';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getActionColor = (action: string) => {
    if (action.includes('إضافة')) return 'bg-emerald-100 text-emerald-700';
    if (action.includes('تعديل')) return 'bg-blue-100 text-blue-700';
    if (action.includes('حذف')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">جاري التحميل...</div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">سجل العمليات</h2>
        <div className="text-sm text-gray-600">
          {operations.length} عملية
        </div>
      </div>

      {/* Operations List */}
      {operations.length > 0 ? (
        <div className="space-y-3">
          {operations.map((operation) => {
            const isExpanded = expandedOps.has(operation.id);
            const hasDetails = operation.oldValue || operation.newValue;

            return (
              <div
                key={operation.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${getActionColor(operation.action)}`}>
                        {operation.action}
                      </span>
                      <span className="text-sm px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {operation.entity}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(operation.timestamp).toLocaleString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {hasDetails && (
                    <button
                      onClick={() => toggleExpand(operation.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-gray-600" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-600" />
                      )}
                    </button>
                  )}
                </div>

                {isExpanded && hasDetails && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    {operation.oldValue && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">القيمة القديمة:</div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <pre className="text-xs text-red-800 whitespace-pre-wrap break-words" dir="ltr">
                            {formatValue(operation.oldValue)}
                          </pre>
                        </div>
                      </div>
                    )}
                    {operation.newValue && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">القيمة الجديدة:</div>
                        <div className="bg-emerald-50 p-3 rounded-lg">
                          <pre className="text-xs text-emerald-800 whitespace-pre-wrap break-words" dir="ltr">
                            {formatValue(operation.newValue)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>لا توجد عمليات مسجلة بعد</p>
          <p className="text-sm">سيتم تسجيل جميع التغييرات التي تقوم بها هنا</p>
        </div>
      )}

      {/* Info Box */}
      {operations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700">
            يتم حفظ آخر 100 عملية. العمليات القديمة سيتم حذفها تلقائياً.
          </p>
        </div>
      )}
    </div>
  );
}
