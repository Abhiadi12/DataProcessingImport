import MoreVertIcon from "@mui/icons-material/MoreVert";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Link as RouterLink } from "react-router";
import { COMMON_MESSAGES, PROJECTS_MESSAGES, projectPath } from "@/constants";
import type { ProjectCardProps } from "@/types";
import { formatDate } from "@/utils/format";

export function ProjectCard({ project, canManage, onEdit, onDelete }: ProjectCardProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const closeMenu = () => setAnchor(null);

  return (
    <Card className="relative h-full">
      {/* The whole card is the link. The menu button sits on top of it rather
          than inside it — a button inside a link is invalid HTML and would
          also open the project when clicked. */}
      <CardActionArea component={RouterLink} to={projectPath(project.id)} className="h-full">
        <CardContent className="flex h-full flex-col gap-2 p-5">
          <Typography variant="h6" component="h2" className="truncate pr-8">
            {project.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" className="line-clamp-2 min-h-10">
            {project.description || PROJECTS_MESSAGES.NO_DESCRIPTION}
          </Typography>
          <Typography variant="caption" color="text.secondary" className="mt-auto pt-2">
            {PROJECTS_MESSAGES.CREATED_ON} {formatDate(project.createdAt)}
          </Typography>
        </CardContent>
      </CardActionArea>

      {canManage && (
        <>
          <IconButton
            size="small"
            className="absolute top-3 right-2"
            onClick={(event) => setAnchor(event.currentTarget)}
            aria-label={PROJECTS_MESSAGES.actionsFor(project.name)}
            aria-haspopup="menu"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenu}>
            <MenuItem
              onClick={() => {
                closeMenu();
                onEdit(project);
              }}
            >
              {COMMON_MESSAGES.EDIT}
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeMenu();
                onDelete(project);
              }}
            >
              {COMMON_MESSAGES.DELETE}
            </MenuItem>
          </Menu>
        </>
      )}
    </Card>
  );
}
