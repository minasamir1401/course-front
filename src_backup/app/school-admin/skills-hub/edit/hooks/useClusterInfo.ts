import { useState } from 'react';
import { API_URL } from '@/lib/api';

export const useClusterInfo = (props: { clusterId: string | null; language: string; showToast: any; router: any }) => {
  const { clusterId, language, showToast, router } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'lessons'>('info');
  
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);

  const [clusterData, setClusterData] = useState<any>({
    id: "", name: "", description: "", subject: "", isCentral: false
  });

  const fetchSchools = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/schools`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSchools(data || []);
      }
    } catch (err) {
      console.error('Error fetching schools:', err);
    }
  };

  const fetchClusterData = async () => {
    try {
      const token = localStorage.getItem('school_admin_token');
      if (!token) {
        router.push('/login');
        return;
      }
      setIsSuperAdmin(true);
      await fetchSchools(token);

      if (!clusterId) {
        setIsLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/skills-hub/clusters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const clusters = Array.isArray(data) ? data : data.clusters || [];
        const current = clusters.find((c: any) => c.id === clusterId);
        
        if (current) {
          setClusterData({
            id: current.id,
            name: current.name || "",
            description: current.description || "",
            subject: current.subject || "",
            isCentral: current.isCentral || false
          });
          
          if (current.grades && Array.isArray(current.grades)) {
            setSelectedGrades(current.grades);
          }
          if (current.schoolIds && Array.isArray(current.schoolIds)) {
            setSelectedSchoolIds(current.schoolIds);
          }
        } else {
          showToast(language === 'ar' ? 'المسار غير موجود' : 'Cluster not found', 'error');
          router.push('/super-admin/skills-hub');
        }
      }
    } catch (err) {
      console.error('Error fetching cluster data:', err);
      showToast(language === 'ar' ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCluster = async () => {
    if (!clusterData.name || !clusterData.subject || selectedGrades.length === 0) {
      showToast(language === 'ar' ? 'يرجى إكمال البيانات الأساسية' : 'Please fill all required fields', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('school_admin_token');
      const res = await fetch(`${API_URL}/skills-hub/clusters/${clusterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: clusterData.name,
          description: clusterData.description,
          subject: clusterData.subject,
          grades: selectedGrades,
          schoolIds: selectedSchoolIds,
          isCentral: clusterData.isCentral
        })
      });

      if (res.ok) {
        showToast(language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || (language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving cluster'), 'error');
      }
    } catch (err) {
      console.error('Error updating cluster:', err);
      showToast(language === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading, isSaving, schools, isSuperAdmin, activeTab, setActiveTab,
    selectedGrades, setSelectedGrades, selectedSchoolIds, setSelectedSchoolIds,
    clusterData, setClusterData, fetchClusterData, handleUpdateCluster
  };
};
