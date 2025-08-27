import React from "react";
import Link from "next/link";
import { MoreVerticalIcon } from "@/components/Icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ItemCardProps {
  id: string | number;
  title: string;
  subtitle?: string;
  linkPath: string;
  date?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({
  id,
  title,
  subtitle,
  linkPath,
  date,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  return (
    <Link href={linkPath} className="block no-underline h-full">
      <Card className="hover:bg-accent hover:shadow-md transition-all duration-200 h-full flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
          <CardTitle className="text-lg line-clamp-1">{title}</CardTitle>

          {showActions && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 ml-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleDelete}
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>

        <CardContent className="p-4 pt-0 flex flex-col flex-1 justify-between">
          <div>
            {subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
          {formattedDate && (
            <p className="text-xs text-muted-foreground mt-auto pt-2 text-right">
              {formattedDate}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default ItemCard;
