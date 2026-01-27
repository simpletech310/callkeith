import { getUsers } from "@/app/actions/admin";
import { Icons } from "@/components/ui/Icons";

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Users & Roles</h2>
                    <p className="text-sm text-slate-500">Manage system access and permissions.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Last Sign In</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user: any) => (
                            <tr key={user.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-medium text-slate-900">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                    ${user.user_metadata?.role === 'superadmin' ? 'bg-purple-50 text-purple-700' :
                                            user.user_metadata?.role === 'org_admin' ? 'bg-blue-50 text-blue-700' :
                                                'bg-slate-100 text-slate-600'}`}>
                                        {user.user_metadata?.role || 'user'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-red-500 transition-colors">
                                        Reset Password
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
