import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Users,
  Globe,
  Database,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
} from "lucide-react";

const users = [
  { id: "1", name: "Alex Johnson", role: "Manager", phone: "0755 123 456", status: "Active" },
  { id: "2", name: "Mary Swai", role: "Cashier", phone: "0712 456 789", status: "Active" },
  { id: "3", name: "John Mwamba", role: "Cashier", phone: "0688 111 222", status: "Inactive" },
];

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your shop settings, users, and preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Shop Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Shop Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Shop Name</Label>
              <Input defaultValue="Colman Hardware" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input defaultValue="0622 123 456" />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input defaultValue="Soko Kuu, Dodoma" />
            </div>
            <Button className="mt-2">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Language & Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Language & Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select defaultValue="en">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sw">Swahili</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Low Stock Alerts</p>
                <p className="text-sm text-muted-foreground">Notify when items are low</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto Print Receipt</p>
                <p className="text-sm text-muted-foreground">Print after each sale</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Backup & Restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Backup & Restore
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a backup of your data or restore from a previous backup.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Create Backup
              </Button>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Restore Backup
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Last backup: 23 Oct 2024, 11:30 AM
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            User Management
          </CardTitle>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "Active" ? "default" : "secondary"}
                      className={
                        user.status === "Active"
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : ""
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
