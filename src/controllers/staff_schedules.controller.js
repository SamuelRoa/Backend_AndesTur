import { StaffScheduleModel } from "../models/staff_schedules.models.js";

export const getSchedules = async (req, res) => {
  try {
    const { id } = req.params;
    const schedules = await StaffScheduleModel.findAll({
      where: { id_staff: id },
      order: [["day_of_week", "ASC"]],
    });
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error cargando horarios", error: error.message });
  }
};

export const saveSchedules = async (req, res) => {
  try {
    const { id } = req.params;
    const { schedules } = req.body;

    if (!Array.isArray(schedules)) {
      return res.status(400).json({ success: false, message: "Se requiere un array de horarios" });
    }

    const MIN = "08:00";
    const MAX = "17:00";

    for (const s of schedules) {
      if (s.start_time < MIN || s.start_time > MAX || s.end_time < MIN || s.end_time > MAX) {
        return res.status(400).json({
          success: false,
          message: `Horario inválido para el día ${s.day_of_week}. Las horas deben estar entre ${MIN} y ${MAX}.`,
        });
      }
      if (s.start_time >= s.end_time) {
        return res.status(400).json({
          success: false,
          message: `Horario inválido para el día ${s.day_of_week}. La hora de inicio debe ser menor a la de fin.`,
        });
      }
    }

    await StaffScheduleModel.destroy({ where: { id_staff: id } });

    const created = [];
    for (const s of schedules) {
      if (s.day_of_week === undefined || !s.start_time || !s.end_time) continue;
      const schedule = await StaffScheduleModel.create({
        id_staff: id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: s.is_active !== false,
      });
      created.push(schedule);
    }

    res.json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error guardando horarios", error: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await StaffScheduleModel.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({ success: false, message: "Horario no encontrado" });
    }
    await schedule.destroy();
    res.json({ success: true, message: "Horario eliminado" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error eliminando horario", error: error.message });
  }
};